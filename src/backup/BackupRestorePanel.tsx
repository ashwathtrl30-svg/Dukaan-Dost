import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import {
  decryptShopBackup,
  encryptShopBackup,
  getBackupFilename,
  validateBackupPassphrase,
  type BackupRestoreMode,
  type DecryptedShopBackup,
} from './encryptedBackup';

export function BackupRestorePanel() {
  const { authUser, createShopBackup, restoreShopBackup } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createPassphrase, setCreatePassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [backupText, setBackupText] = useState('');
  const [preparedBackup, setPreparedBackup] = useState<DecryptedShopBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<BackupRestoreMode>('merge');
  const [allowDifferentOwner, setAllowDifferentOwner] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const belongsToCurrentAccount = !!preparedBackup && preparedBackup.ownerId === authUser?.id;
  const requiresOtherOwnerConfirmation = !!preparedBackup && !belongsToCurrentAccount;
  const restoreNeedsConfirmation =
    !!preparedBackup &&
    (!requiresOtherOwnerConfirmation || allowDifferentOwner) &&
    (restoreMode !== 'replace' || confirmReplace);

  const handleCreateBackup = async () => {
    const passwordError = validateBackupPassphrase(createPassphrase);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (createPassphrase !== confirmPassphrase) {
      setError('The two backup passphrases do not match.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      // Store asks the cloud for the newest snapshot, then flushes pending local edits
      // before the encrypted file is created.
      const { snapshot, ownerId } = await createShopBackup();
      const createdAt = new Date().toISOString();
      const encrypted = await encryptShopBackup(snapshot, ownerId, createPassphrase, createdAt);
      const blob = new Blob([encrypted], { type: 'application/vnd.dukaandost.backup+json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = getBackupFilename(createdAt);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setCreatePassphrase('');
      setConfirmPassphrase('');
      setMessage('Encrypted backup created. Store the file and passphrase separately; Dukaan Dost cannot recover a forgotten backup passphrase.');
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : 'Could not create the backup.');
    } finally {
      setBusy(false);
    }
  };

  const handleReadBackup = async () => {
    const passwordError = validateBackupPassphrase(restorePassphrase);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (!backupText) {
      setError('Choose a Dukaan Dost backup file first.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    setPreparedBackup(null);
    try {
      const decrypted = await decryptShopBackup(backupText, restorePassphrase);
      setPreparedBackup(decrypted);
      setAllowDifferentOwner(false);
      setConfirmReplace(false);
      setRestoreMode('merge');
      setMessage('Backup decrypted and validated. Review the shop and record counts before restoring.');
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Could not open this backup.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!preparedBackup || !authUser?.id) return;
    if (requiresOtherOwnerConfirmation && !allowDifferentOwner) {
      setError('Confirm that you intend to restore a backup from another shop account.');
      return;
    }
    if (restoreMode === 'replace' && !confirmReplace) {
      setError('Confirm that you intend to replace the current shop data.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await restoreShopBackup(
        preparedBackup.snapshot,
        preparedBackup.ownerId,
        restoreMode,
        allowDifferentOwner,
      );
      setPreparedBackup(null);
      setBackupText('');
      setRestorePassphrase('');
      setAllowDifferentOwner(false);
      setConfirmReplace(false);
      setMessage(
        restoreMode === 'merge'
          ? 'Backup merged into this shop and saved to the cloud.'
          : 'Shop data replaced with the selected backup and saved to the cloud.',
      );
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Could not restore this backup.');
    } finally {
      setBusy(false);
    }
  };

  const recordCount = preparedBackup
    ? preparedBackup.counts.sales +
      preparedBackup.counts.expenses +
      preparedBackup.counts.udhaar +
      preparedBackup.counts.notebookNotes +
      preparedBackup.counts.chatSessions +
      preparedBackup.counts.insights
    : 0;

  return (
    <section className="card mb-4 p-4 space-y-4" aria-labelledby="backup-restore-heading">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">🗄️</div>
        <div className="min-w-0 flex-1">
          <h2 id="backup-restore-heading" className="text-body-lg font-bold text-text">Backup & restore</h2>
          <p className="text-sm text-text-secondary mt-1">
            Create a password-encrypted copy of your latest cloud shop data, or restore a previous copy.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-bg p-3 space-y-3">
        <div>
          <p className="text-sm font-semibold text-text">Create encrypted backup</p>
          <p className="text-xs text-text-secondary mt-1">
            Your latest cloud data is refreshed before the file is created. The phone number and local app-lock PIN are not included.
          </p>
        </div>
        <input
          type="password"
          autoComplete="new-password"
          value={createPassphrase}
          onChange={(event) => setCreatePassphrase(event.target.value)}
          className="input-field w-full"
          placeholder="Backup passphrase (12+ characters)"
          disabled={busy}
        />
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassphrase}
          onChange={(event) => setConfirmPassphrase(event.target.value)}
          className="input-field w-full"
          placeholder="Confirm backup passphrase"
          disabled={busy}
        />
        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={busy || !createPassphrase || !confirmPassphrase}
          className="btn-primary w-full disabled:opacity-40"
        >
          {busy ? 'Preparing backup…' : 'Download encrypted backup'}
        </button>
      </div>

      <div className="rounded-xl bg-bg p-3 space-y-3">
        <div>
          <p className="text-sm font-semibold text-text">Restore from backup</p>
          <p className="text-xs text-text-secondary mt-1">
            Select a .ddbackup file and enter the passphrase used when it was created. It is checked before any shop data is changed.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ddbackup,application/json"
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            setPreparedBackup(null);
            setBackupText('');
            setError('');
            setMessage('');
            if (!file) return;
            if (file.size > 20 * 1024 * 1024) {
              setError('This backup file is too large to open safely.');
              event.target.value = '';
              return;
            }
            try {
              setBackupText(await file.text());
            } catch {
              setError('The selected backup file could not be read.');
            }
          }}
        />
        <input
          type="password"
          autoComplete="current-password"
          value={restorePassphrase}
          onChange={(event) => setRestorePassphrase(event.target.value)}
          className="input-field w-full"
          placeholder="Backup passphrase"
          disabled={busy}
        />
        <button
          type="button"
          onClick={handleReadBackup}
          disabled={busy || !backupText || !restorePassphrase}
          className="btn-secondary w-full disabled:opacity-40"
        >
          {busy ? 'Checking backup…' : 'Check backup file'}
        </button>
      </div>

      {preparedBackup && (
        <div className="rounded-xl border border-border p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold text-text">Backup verified</p>
            <p className="text-sm text-text mt-1">Shop: {preparedBackup.shopName}</p>
            <p className="text-xs text-text-secondary">
              Created: {new Date(preparedBackup.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {recordCount} saved records: {preparedBackup.counts.sales} sales, {preparedBackup.counts.expenses} expenses, {preparedBackup.counts.udhaar} udhaar, {preparedBackup.counts.notebookNotes} notes, {preparedBackup.counts.chatSessions} chats and {preparedBackup.counts.insights} insights.
            </p>
          </div>

          {requiresOtherOwnerConfirmation && (
            <label className="flex items-start gap-2 text-xs text-warning">
              <input
                type="checkbox"
                checked={allowDifferentOwner}
                onChange={(event) => setAllowDifferentOwner(event.target.checked)}
                className="mt-0.5"
                disabled={busy}
              />
              <span>This backup belongs to a different shop account. I intend to restore its data into the currently signed-in shop.</span>
            </label>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-text">How should it be restored?</p>
            <label className="flex items-start gap-2 text-sm text-text">
              <input
                type="radio"
                name="backup-restore-mode"
                value="merge"
                checked={restoreMode === 'merge'}
                onChange={() => { setRestoreMode('merge'); setConfirmReplace(false); }}
                disabled={busy}
              />
              <span>
                <strong>Merge with current shop</strong>
                <span className="block text-xs text-text-secondary">Keeps current records and merges backup records by ID. Existing deletion history is respected.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-text">
              <input
                type="radio"
                name="backup-restore-mode"
                value="replace"
                checked={restoreMode === 'replace'}
                onChange={() => setRestoreMode('replace')}
                disabled={busy}
              />
              <span>
                <strong>Replace current shop data</strong>
                <span className="block text-xs text-text-secondary">Restores the exact saved shop snapshot. Data added after this backup will be removed.</span>
              </span>
            </label>
          </div>

          {restoreMode === 'replace' && (
            <label className="flex items-start gap-2 text-xs text-problem">
              <input
                type="checkbox"
                checked={confirmReplace}
                onChange={(event) => setConfirmReplace(event.target.checked)}
                className="mt-0.5"
                disabled={busy}
              />
              <span>I understand that replacing the current shop data can permanently remove newer records.</span>
            </label>
          )}

          <button
            type="button"
            onClick={handleRestore}
            disabled={busy || !restoreNeedsConfirmation}
            className="btn-primary w-full disabled:opacity-40"
          >
            {busy ? 'Restoring…' : restoreMode === 'merge' ? 'Merge backup into shop' : 'Replace shop from backup'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-problem" role="alert">{error}</p>}
      {message && <p className="text-sm text-positive" role="status">{message}</p>}

      <p className="text-xs text-text-secondary">
        Keep the backup file and passphrase in separate safe places. Losing the passphrase means the encrypted file cannot be opened. Backups are portable shop-data files, not a full Supabase database or account backup.
      </p>
    </section>
  );
}
