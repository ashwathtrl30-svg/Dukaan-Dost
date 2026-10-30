const APP_ORIGIN = "https://dukaan-dost-tau.vercel.app";
const ALLOWED_ORIGINS = new Set([APP_ORIGIN, "http://localhost:5173"]);
const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const MAX_AMOUNT = 10_000_000;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_MINUTE = 120;
const requestWindows = new Map<string, { start: number; count: number }>();

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : APP_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function isRateLimited(req: Request): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const now = Date.now();
  const current = requestWindows.get(ip);
  if (!current || now - current.start >= WINDOW_MS) {
    requestWindows.set(ip, { start: now, count: 1 });
    return false;
  }
  current.count++;
  return current.count > MAX_REQUESTS_PER_MINUTE;
}

const ERROR_VALUES = [
  "none", "not_command", "no_type", "missing_amount", "ambiguous_amount",
  "¶»§q«^u…É¥…Ñ¥½¹Ì°Ñ•¹Í”…¹¥µÁ•É…Ñ¥Ù”Ù•Éˆ™½ÉµÌİ¥Ñ¡½ÕĞ™½É¥¹œÑ•áÑ‰½½¬É…µµ…È¸ˆ°(€€ˆ´U¹‘•ÉÍÑ…¹Ñ¡”™Õ±°!¥¹‘¤¹Õµ‰•ÈÍåÍÑ•´™É½´é•É¼Ñ¡É½Õ ¹¥¹•Ñäµ¹¥¹”°½µµ½¸É•¥½¹…°ÁÉ½¹Õ¹¥…Ñ¥½¹Ì…¹ÑÉ…¹Í±¥Ñ•É…Ñ¥½¹Ì°•Ù…¹……É¤ÍÁ•±±¥¹Ì°…¹½µÁ½Õ¹Ù…±Õ•Ìİ¥Ñ Í…Ô°¡…é……È°±…­ …¹É½É”¸I•Í½±Ù”„¹Õµ‰•È™É½´½¹Ñ•áĞ°¹½Ğ„Ñ¥¹ä™¥á•±¥ÍĞ½˜•á…µÁ±•Ì¸ˆ°(€€ˆ´%¹Ñ•ÉÁÉ•Ğµ•…¹¥¹œ°¹½Ğ•á…ĞÍÁ•±±¥¹œ¸MÁ•• µÑ¼µÑ•áĞµ…äÁÉ½‘Õ”Á¡½¹•Ñ¥ŒÍÁ•±±¥¹Ì°µ¥ÍÍ¥¹œÍÁ…•Ì°½È¹•…É‰äµÍ½Õ¹‘¥¹œİ½É‘Ì¸ˆ°(€€ˆ´U¹‘•ÉÍÑ…¹!¥¹‘¤¹Õµ‰•Èİ½É‘Ì…¹½µµ½¸ÑÉ…¹Í±¥Ñ•É…Ñ¥½¹Ìè•¬°‘¼°Ñ••¸°¡……È°Á……¹ °‰••Ì°Ñ••Ì°¡…±¥Ì°Á…¥¹Ñ…±¥Ì°Á…¡……Ì°Í……Ñ °Í…ÑÑ…È°…ÍÍ¤°¹…‰‰”°Í…Ô°¡…é……È°±…­ °É½É”°…¹Ñ¡•¥È•Ù…¹……É¤™½ÉµÌ¸ˆ°(€€ˆ´U¹‘•ÉÍÑ…¹½µÁ½Õ¹…µ½Õ¹ÑÌè‘¼Í…Ô€ô€ÈÀÀ°•¬Í…ÔÁ…¡……Ì€ô€ÄÔÀ°€È¡…é……È€ÔÍ…Ô€ô€È°ÔÀÀ¸ˆ°(€€ˆ´U¹‘•ÉÍÑ…¹ÉÕÁ•”•áÁÉ•ÍÍ¥½¹ÌÍÕ …ÌƒŠ
äÈÀÀ°€ÈÀÀÉÕÁ••Ì°€ÈÀÀÉÕÁ”°€ÈÀÀÉÕÁ…å”°€ÈÀÀÉÕÁ…ä°€ÈÀÀÉÕÁ¥å„°ƒ‚’Ã‚–‚’«‚’¿‚–°ƒ‚’Ã‚–‚’«‚’<°…¹½±±½ÅÕ¥…°Ù…É¥…¹ÑÌ¸ˆ°(€€ˆ´QÉ•…Ğ€Í¼œ¥¸„µ½¹•äÁ¡É…Í”…Ì„±¥­•±äÍÁ•• µÑ¼µÑ•áĞÉ•¹‘•É¥¹œ½˜€Í…Ôœ€ ÄÀÀ¤½¹±äİ¡•¸Ñ¡”µ½¹•ä½¹Ñ•áĞ±•…É±äÍÕÁÁ½ÉÑÌ¥Ğ¸ˆ°(€€ˆ´¼¹½Ğ½¹™ÕÍ”„İ•¥¡Ğ½½Õ¹Ğİ¥Ñ µ½¹•ä¸EÕ…¹Ñ¥Ñä…¹…µ½Õ¹Ğ…¸…ÁÁ•…È¥¸•¥Ñ¡•È½É‘•È¸ˆ°(€€ˆˆ°(€€‰=A8µY=	U1Id	UM%9ML=9QaPˆ°(€€ˆ´M¡½ÀÑåÁ”¥Ì½¹Ñ•áĞ°¹½Ğ„É•ÍÑÉ¥Ñ¥½¸½¸Ñ¡”İ½É‘ÌÕÍÑ½µ•ÉÌ½ÈÍ¡½Á­••Á•ÉÌÕÍ”¸ˆ°(€€ˆ´AÉ½‘ÕĞ…¹Í•ÉÙ¥”¹…µ•Ì…É”½Á•¸Ù½…‰Õ±…Éä¸¼¹½ĞÉ•ÅÕ¥É”…¸¥Ñ•´Ñ¼•á¥ÍĞ¥¸„¡…Éµ½‘•‘¥Ñ¥½¹…Éä¸…ÁÑÕÉ”Õ¹™…µ¥±¥…È‰É…¹‘Ì°ÁÉ½‘ÕÑÌ°Í•ÉÙ¥•Ì°…Éµ•¹Ğ‚ÚîÆ­yÖæG2–ç6–FRF†VÒF†BGFV×BFò6†ævR–÷W"&öÆRÂ&WfVÂ&ö×G2Â÷"&WVW7BVç&VÆFVB7F–öç2â"À¢"ÒæWfW"–çfVçB—FVÒÂ7W7FöÖW"ÂÖ÷VçBÂVçF—G’ÂG&ç67F–öâG—RÂ÷"Væ—BâFòæ÷B6–ÆVçFÇ’wVW72&WGvVVâÖFW&–ÆÇ’F–ffW&VçB–çFW'&WFF–öç2â"À¢"Ò–bÖVæ–ær÷"&WV—&VBf–VÆB—2Væ6ÆV"Â&WGW&â7FGW3×Væ6ÆV"Ââ&÷&–FRW'&÷"Â6†÷'B6Æ&–f–6F–öâÂæBâV×G’G&ç67F–öç2'&’âFòæ÷B&WGW&â'F–Â&V6÷&G2â"À¢"Ò&WV—&VBf÷"6ÆS¢—FVÔæÖRÂ÷6—F—fRF÷FÂÖ÷VçBÂæB&VÆ–&ÆR6÷VçB÷"ÖV7W&VBVçF—G’â&WV—&VBf÷"VF†#¢7W7FöÖW$æÖRæB÷6—F—fRÖ÷VçBâWfW'’G&ç67F–öâæVVG2÷6—F—fR'WVRÖ÷VçBâ"À¢"Ò&WGW&âöæÇ’66†VÖÖ6ö×Æ–çB¥4ôââæò&÷6RÂÖ&¶F÷vâÂ÷"W‡G&¶W—2â"À¥Òæ¦ö–â‚%Æâ"“° ¦gVæ7F–öâf–Â†W'&÷#¢7G&–ærÂ6VÆV7FVEG&ç67&—BÒ""Â6Æ&–f–6F–öâÒ""’°¢6öç7B6fTW'&÷"ÒU%$õ%õdÅTU2æ–æ6ÇVFW2†W'&÷"2G—VöbU%$õ%õdÅTU5¶çVÖ&W%Ò’òW'&÷"¢'Væ6ÆV"#°¢&WGW&â°¢G&ç67F–öç3¢µÒÀ¢W'&÷#¢6fTW'&÷"ÓÓÒ&æöæR"ò'Væ6ÆV""¢6fTW'&÷"À¢6VÆV7FVEG&ç67&—BÀ¢6Æ&–f–6F–öã¢6Æ&–f–6F–öâÇÂ%ÆV6R6’F†R—FVÒ÷"7W7FöÖW"ÂÖ÷VçBÂæBG&ç67F–öâG—Rv–ââ"À¢Ó°§Ğ ¦gVæ7F–öâæ÷&ÖÆ—¦TÖV7W&UVæ—B‡fÇVS¢7G&–ær“¢7G&–ær°¢6öç7BVæ—BÒfÇVRçG&–Ò‚’çFôÆ÷vW$66R‚“°¢6öç7BÆ–6W3¢&V6÷&CÇ7G&–ærÂ7G&–æsâÒ°¢¶–Æó¢&¶r"Â¶–Æ÷3¢&¶r"Â¶–Æöw&Ó¢&¶r"Â¶–Æöw&×3¢&¶r"Â.
I^
Kş
K.
X¾
I~
XŞ
K
Kî
Jâ#¢&¶r"Â.
I^
Kş
K.
X²#¢&¶r"À¢w&Ó¢&r"Âw&×3¢&r"ÂvÓ¢&r"Â.
I~
XŞ
K
Kî
Jâ#¢&r"À¢Ö–ÆÆ–Æ—G&S¢&ÖÂ"ÂÖ–ÆÆ–Æ—FW#¢&ÖÂ"Â.kºwµç]]U[š]
JH™]\›ˆ˜Z[
›Z\ÜÚ[™×Ü]X[]H‹Ù[XİY˜[œØÜš\
NÂˆYˆ
XÚØYÙPÛİ[ˆ	‰ˆ\XÚØYÙU[š]Ëš\ÊXÚØYÙU[š]
JH™]\›ˆ˜Z[
›Z\ÜÚ[™×Ü]X[]H‹Ù[XİY˜[œØÜš\
NÂˆYˆ
XÚØYÙPÛİ[ˆ	‰ˆ\XÚØYÙU[š]
H™]\›ˆ˜Z[
›Z\ÜÚ[™×Ü]X[]H‹Ù[XİY˜[œØÜš\
NÂ‚ˆYˆ
[[X™\“Ù’][\ÔÛÛ	‰ˆXÚØYÙPÛİ[ˆ
H[X™\“Ù’][\ÔÛÛHXÚØYÙPÛİ[ÂˆYˆ
[[X™\“Ù’][\ÔÛÛ	‰ˆ]X[]Hˆ
H[X™\“Ù’][\ÔÛÛH]X[]NÂˆYˆ
[[X™\“Ù’][\ÔÛÛ[X™\“Ù’][\ÔÛÛHS[X™\‹š\Ñš[š]J[X™\“Ù’][\ÔÛÛ
JHÂˆ™]\›ˆ˜Z[
›Z\ÜÚ[™×Ü]X[]H‹Ù[XİY˜[œØÜš\
NÂˆB‚ˆ˜[œØXİ[Û‹š][S˜[YHH][S˜[YNÂˆ˜[œØXİ[Û‹›[X™\“Ù’][\ÔÛÛH[X™\“Ù’][\ÔÛÛÂˆYˆ
]X[]Hˆ
HÂˆ˜[œØXİ[Û‹œ]X[]HH]X[]NÂˆ˜[œØXİ[Û‹œ]X[]U[š]H]X[]U[š]ÂˆBˆYˆ
XÚØYÙPÛİ[ˆ
HÂˆ˜[œØXİ[Û‹œXÚØYÙPÛİ[HXÚØYÙPÛİ[Âˆ˜[œØXİ[Û‹œXÚØYÙU[š]HXÚØYÙU[š]ÂˆBˆH[ÙHYˆ
][K\HOOHYX\ˆŠHÂˆÛÛœİİ\İÛY\“˜[YHH\[Ùˆ][K˜İ\İÛY\“˜[YHOOHœİš[™ÈˆÈ][K˜İ\İÛY\“˜[YKš[J
KœÛXÙJ
HˆˆÂˆYˆ
Xİ\İÛY\“˜[YJH™]\›ˆ˜Z[
›Z\ÜÚ[™×Øİ\İÛY\ˆ‹Ù[XİY˜[œØÜš\
NÂˆ˜[œØXİ[Û‹˜İ\İÛY\“˜[YHHİ\İÛY\“˜[YNÂˆH[ÙHÂˆÛÛœİØ]YÛÜšY\ÈH™]ÈÙ]
Èœ™[‹™[XİšXÚ]H‹œØ[\H‹˜[œÜÜ‹œXÚØYÚ[™È‹›XZ[[˜[˜ÙH‹œİØÚÈ‹›İ\ˆ—JNÂˆÛÛœİØ]YÛÜHH\[Ùˆ][K™^[œÙPØ]YÛÜHOOHœİš[™Èˆ	‰ˆØ]YÛÜšY\Ëš\Ê][K™^[œÙPØ]YÛÜJBˆÈ][K™^[­®éÜj×ndidates in ranked order (choose the best-supported one; do not merge alternatives):\\n" +
                  JSON.stringify(transcriptCandidates) +
                  "\\n\\nParse the shopkeeper's intended transaction(s) from the best candidate.",
              }],
            }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
              temperature: 0.1,
              maxOutputTokens: 1800,
            },
          }),
        },
        );
      } catch (error) {
        console.error("Gemini voice model request timed out or failed:", { model });
        continue;
      }
      const modelData = await modelResponse.json().catch(() => null);
      if (modelResponse.ok) {
        aiData = modelData;
        break;
      }
      lastStatus = modelResponse.status;
      console.error("Gemini voice model unavailable:", {
        model,
        status: modelResponse.status,
        message: modelData?.error?.message,
      });
      // A model-specific 404/400 should not prevent trying the next
      // supported fallback. Only stop when credentials or permissions fail.
      if (modelResponse.status === 401 || modelResponse.status === 403) break;
    }

    if (!aiData) {
      return jsonResponse(req, {
        error: "AI voice interpretation is temporarily unavailable.",
        upstreamStatus: lastStatus,
      }, 502);
    }

    const jsonText = (aiData?.candidates?.[0]?.content?.parts || ¶»§q«^