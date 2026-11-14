import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, Camera, Check, ImagePlus, Loader2, RefreshCw, Trash2, X,
} from 'lucide-react';
import type { PaymentType } from '../types';
import { supabase } from '../supabaseClient';
import {
  parseSaleQuantityInput,
  isValidSaleQuantity,
  getSaleItemCountFromQuantity,
} from '../quantity';
import { rupeesToPaise, validateCameraExtraction } from './extractionContract';

export type CameraSaleDraft = {
  itemName: string;
  amount: number;
  numberOfItemsSold: number;
  quantity: number;
  quantityUnit: string;
  packageCount?: number;
  packageUnit?: string;
  paymentType: Extract<PaymentType, 'cash' | 'upi'>;
};

type SelectedImage = {
  previewUrl: string;
  imageBase64: string;
  mimeType: string;
  originalSize: number;
};

type ReviewRow = {
  id: number;
  productName: string;
  quantityText: string;
  amountText: string;
  reviewReasons: string[];
  amountSource: string;
  checked: boolean;
};

const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

async function compressImage(file: File): Promise<{ blob: Blob; imageBase64: string; mimeType: 'image/jpeg' }> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error('This photo is too large. Choose an image under 15 MB.');

  const bitmap = await createImageBitmap(file);
  try {
    let maxEdge = 2000;
    let quality = 0.84;
    let blob: Blob | null = null;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const currentScale = Math.min(scale, maxEdge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * currentScale));
      canvas.height = Math.max(1, Math.round(bitmap.height * currentScale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('This browser could not prepare the photo.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= 3_000_000) break;
      quality = Math.max(0.62, quality - 0.06);
      maxEdge = Math.round(maxEdge * 0.88);
    }

    if (!blob || blob.size > 3_000_000) {
      throw new Error('The photo is still too large. Take a closer, smaller photo.');
    }

    const buffer = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
      binary += String.fromCharCode(...buffer.subarray(offset, offset + chunkSize));
    }
    return { blob, imageBase64: btoa(binary), mimeType: 'image/jpeg' };
  } finally {
    bitmap.close();
  }
}

export function CameraImportModal({
  onClose,
  onAddSales,
  language,
}: {
  onClose: () => void;
  onAddSales: (sales: CameraSaleDraft[]) => void;
  language: 'en' | 'hi';
}) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [paymentType, setPaymentType] = useState<Extract<PaymentType, 'cash' | 'upi'>>('cash');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage]);

  const prepared = useMemo(() => rows.map(row => {
    const quantity = parseSaleQuantityInput(row.quantityText);
    const amountPaise = rupeesToPaise(Number(row.amountText));
    const name = row.productName.trim();
    const valid = Boolean(
      name &&
      name.length <= 80 &&
      isValidSaleQuantity(quantity) &&
      amountPaise !== null,
    );
    return { row, quantity, amountPaise, valid };
  }), [rows]);

  const canSave = rows.length > 0 && prepared.every(item => item.valid && item.row.checked);

  const chooseFile = async (file?: File) => {
    if (!file) return;
    setWorking(true);
    setError('');
    setRows([]);
    try {
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed.blob);
      setSelectedImage({
        previewUrl,
        imageBase64: compressed.imageBase64,
        mimeType: compressed.mimeType,
        originalSize: file.size,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The photo could not be prepared.');
    } finally {
      setWorking(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void chooseFile(file);
  };

  const extract = async () => {
    if (!selectedImage || !supabase || working) return;
    setWorking(true);
    setError('');
    setRows([]);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error('Your shop session could not be verified. Reopen Dukaan Dost.');
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Your shop session is not ready. Reopen Dukaan Dost and try again.');

      const response = await fetch('/api/extract-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
        body: JSON.stringify({
          imageBase64: selectedImage.imageBase64,
          mimeType: selectedImage.mimeType,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string'
          ? payload.error
          : 'The photo could not be read. Please try again.');
      }

      const validation = validateCameraExtraction(payload?.extraction);
      if (!validation.ok) throw new Error(validation.message);

      setRows(validation.items.map(item => ({
        id: item.sourceIndex,
        productName: item.productName,
        quantityText: item.quantity !== null && item.quantityUnit
          ? item.quantity + ' ' + item.quantityUnit
          : '',
        amountText: item.finalAmount === null ? '' : String(item.finalAmount),
        reviewReasons: item.reviewReasons,
        amountSource: item.amountSource,
        checked: false,
      })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Photo extraction failed. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const updateRow = (id: number, patch: Partial<ReviewRow>) => {
    setRows(current => current.map(row => row.id === id
      ? { ...row, ...patch, checked: false }
      : row));
  };

  const saveRows = () => {
    if (!canSave) return;
    const sales: CameraSaleDraft[] = prepared.map(({ row, quantity, amountPaise }) => {
      const parsed = quantity!;
      return {
        itemName: row.productName.trim(),
        amount: amountPaise! / 100,
        numberOfItemsSold: getSaleItemCountFromQuantity(parsed) ?? 1,
        quantity: parsed.quantity,
        quantityUnit: parsed.quantityUnit,
        ...(parsed.packageCount !== undefined ? { packageCount: parsed.packageCount } : {}),
        ...(parsed.packageUnit ? { packageUnit: parsed.packageUnit } : {}),
        paymentType,
      };
    });
    onAddSales(sales);
  };

  const resetImage = () => {
    setSelectedImage(null);
    setRows([]);
    setError('');
  };

  const lang = language;
  const copy = lang === 'hi' ? {
    title: 'फ़ोटो से बिक्री जोड़ें',
    subtitle: 'बिल या हाथ से लिखी बिक्री सूची स्कैन करें',
    privacy: 'स्कैन करने से पहले ग्राहक का नाम, फ़ोन नंबर और पता हटा दें। फ़ोटो पढ़ने के लिए चुने गए AI प्रदाता को भेजी जाएगी; Dukaan Dost इसे सेव नहीं करता।',
    chooseTitle: 'साफ़ फ़ोटो चुनें',
    chooseDesc: 'सामान का नाम, मात्रा और अंतिम रकम साफ़ दिखनी चाहिए।',
    takePhoto: 'फ़ोटो लें',
    gallery: 'गैलरी से चुनें',
    photoReady: 'फ़ोटो तैयार',
    changePhoto: 'फिर से लें / बदलें',
    readSales: 'बिक्री पढ़ें',
    reading: 'पढ़ रहा है…',
    preparing: 'फ़ोटो तैयार की जा रही है…',
    reviewTitle: 'हर आइटम जाँचें',
    payment: 'इन बिक्री का भुगतान',
    product: 'सामान या सेवा का नाम',
    quantity: 'मात्रा और इकाई',
    amount: 'अंतिम रकम (₹)',
    check: 'कृपया जाँचें',
    calculated: 'यह रकम प्रति-इकाई दर से निकाली गई है। मात्रा, इकाई और गुणा जाँचें।',
    invalid: 'नाम (अधिकतम 80 अक्षर), मान्य मात्रा/इकाई और दो दशमलव तक सही रकम दर्ज करें।',
    reviewed: 'मैंने इस आइटम और रकम को जाँच लिया है',
    add: 'बिक्री जोड़ें',
    nothingSaved: 'पुष्टि करने से पहले कुछ भी सेव नहीं होगा।',
    cancel: 'रद्द करें',
    rows: 'आइटम मिले',
    checked: 'जाँचे गए',
    item: 'आइटम',
    cash: 'नकद',
    upi: 'UPI',
  } : {
    title: 'Add sales from a photo',
    subtitle: 'Scan a bill or handwritten sales list',
    privacy: 'Remove customer names, phone numbers and addresses before scanning. {copy.privacy}',
    chooseTitle: 'Choose a clear photo',
    chooseDesc: 'Keep the item names, quantities and final line amounts readable.',
    takePhoto: 'Take a photo',
    gallery: 'Choose from gallery',
    photoReady: 'Photo ready',
    changePhoto: 'Retake / change',
    readSales: 'Read sales',
    reading: 'Reading…',
    preparing: 'Preparing the photo…',
    reviewTitle: 'Review every item',
    payment: 'Payment method for these sales',
    product: 'Product or service name',
    quantity: 'Quantity and unit',
    amount: 'Final line amount (₹)',
    check: 'Please check',
    calculated: 'This amount was calculated from a unit rate. Check the quantity, unit and multiplication.',
    invalid: 'Enter a name (up to 80 characters), a supported quantity/unit, and a valid amount with up to two decimal places.',
    reviewed: 'I checked this row and its amount',
    add: 'Add sales',
    nothingSaved: 'Nothing is saved until you confirm.',
    cancel: 'Cancel',
    rows: 'rows found',
    checked: 'checked',
    item: 'Item',
    cash: 'Cash',
    upi: 'UPI',
  };

  return (
    <div className="fixed inset-0 z-[70] bg-bg flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="camera-import-title">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button type="button" onClick={onClose} className="w-11 h-11 rounded-full flex items-center justify-center" aria-label={lang === 'hi' ? 'फ़ोटो इम्पोर्ट बंद करें' : 'Close photo import'}>
          <X size={22} className="text-text-secondary" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 id="camera-import-title" className="text-body-lg font-bold text-text">{copy.title}</h2>
          <p className="text-small text-text-secondary">{copy.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 scroll-area px-5 py-4 space-y-4">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-small text-text">
          Remove customer names, phone numbers and addresses before scanning. The photo is sent to the configured AI provider for reading; Dukaan Dost does not save the image.
        </div>

        {!selectedImage ? (
          <div className="card text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Camera size={30} className="text-primary" />
            </div>
            <h3 className="text-section-title text-text mb-2">{copy.chooseTitle}</h3>
            <p className="text-small text-text-secondary mb-5">{copy.chooseDesc}</p>
            <div className="space-y-3">
              <button type="button" className="btn-primary" disabled={working} onClick={() => cameraInputRef.current?.click()}>
                <Camera size={19} /> Take a photo
              </button>
              <button type="button" className="btn-secondary" disabled={working} onClick={() => galleryInputRef.current?.click()}>
                <ImagePlus size={19} /> Choose from gallery
              </button>
            </div>
          </div>
        ) : (
          <div className="card space-y-3">
            <img src={selectedImage.previewUrl} alt="Selected sales document preview" className="w-full max-h-[34vh] object-contain rounded-xl bg-white" />
            <p className="text-small text-text-secondary">
              Photo ready · {(selectedImage.originalSize / 1024 / 1024).toFixed(1)} MB original
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn-secondary" disabled={working} onClick={resetImage}>
                <RefreshCw size={17} /> Retake / change
              </button>
              <button type="button" className="btn-primary" disabled={working} onClick={() => void extract()}>
                {working ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                {working ? 'Reading…' : 'Read sales'}
              </button>
            </div>
          </div>
        )}

        {working && (
          <div className="card flex items-center gap-3 text-small text-text-secondary">
            <Loader2 size={18} className="animate-spin text-primary" />
            Preparing the photo securely…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-small text-problem" role="alert">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-3 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-section-title text-text">{copy.reviewTitle}</h3>
                <p className="text-small text-text-secondary">{rows.length} {copy.rows} · {copy.nothingSaved}</p>
              </div>
              <span className="text-small font-semibold text-primary whitespace-nowrap">
                {rows.filter(row => row.checked).length}/{rows.length} {copy.checked}
              </span>
            </div>

            <div className="card">
              <label className="text-small font-medium text-text-secondary block mb-2">{copy.payment}</label>
              <select className="input-field" value={paymentType} onChange={event => setPaymentType(event.target.value as Extract<PaymentType, 'cash' | 'upi'>)}>
                <option value="cash">{copy.cash}</option>
                <option value="upi">{copy.upi}</option>
              </select>
            </div>

            {rows.map((row, index) => {
              const rowState = prepared[index];
              return (
                <div key={row.id} className="card space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-small font-bold text-text">{copy.item} {index + 1}</p>
                    <button type="button" onClick={() => setRows(current => current.filter(item => item.id !== row.id))} className="w-10 h-10 rounded-full flex items-center justify-center text-problem" aria-label={(lang === 'hi' ? 'आइटम हटाएँ ' : 'Remove item ') + (index + 1)}>
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div>
                    <label className="text-small text-text-secondary block mb-1">{copy.product}</label>
                    <input className="input-field" value={row.productName} maxLength={120} onChange={event => updateRow(row.id, { productName: event.target.value.slice(0, 120) })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-small text-text-secondary block mb-1">{copy.quantity}</label>
                      <input className="input-field" value={row.quantityText} placeholder={lang === 'hi' ? 'जैसे 2 किलो, 3 पैकेट' : 'e.g. 2 kg, 3 packets'} onChange={event => updateRow(row.id, { quantityText: event.target.value.slice(0, 80) })} />
                    </div>
                    <div>
                      <label className="text-small text-text-secondary block mb-1">{copy.amount}</label>
                      <input className="input-field" type="number" inputMode="decimal" min="0" step="0.01" value={row.amountText} onChange={event => updateRow(row.id, { amountText: event.target.value.slice(0, 14) })} />
                    </div>
                  </div>

                  {row.reviewReasons.length > 0 && (
                    <div className="rounded-xl bg-amber-50 p-3 text-small text-text">
                      <p className="font-semibold mb-1">{copy.check}</p>
                      {row.reviewReasons.map((reason, reasonIndex) => <p key={reasonIndex}>• {reason}</p>)}
                    </div>
                  )}
                  {row.amountSource === 'explicit_unit_rate_calculation' && (
                    <p className="text-small text-warning">{copy.calculated}</p>
                  )}

                  {!rowState.valid && (
                    <p className="text-small text-problem">
                      Enter a name (up to 80 characters), a supported quantity/unit, and a valid amount with up to two decimal places.
                    </p>
                  )}

                  <label className="flex items-center gap-2 min-h-11 text-small text-text">
                    <input type="checkbox" checked={row.checked} disabled={!rowState.valid} onChange={event => setRows(current => current.map(item => item.id === row.id ? { ...item, checked: event.target.checked } : item))} />
                    I checked this row and its amount
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-border safe-bottom space-y-2">
        {rows.length > 0 ? (
          <button type="button" className="btn-primary" disabled={!canSave || working} onClick={saveRows}>
            <Check size={19} /> {copy.add} ({rows.length})
          </button>
        ) : (
          <p className="text-small text-text-secondary text-center">{lang === 'hi' ? 'Sales में जोड़ने से पहले हर आइटम जाँचें।' : 'Check each extracted row before adding it to Sales.'}</p>
        )}
        <button type="button" className="btn-text w-full" onClick={onClose} disabled={working}>{copy.cancel}</button>
      </div>
    </div>
  );
}
