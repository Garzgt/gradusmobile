import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../../config/supabase';

const CERTIFICATE_BUCKET = 'certificates';

function toTitleCase(str) {
  return String(str ?? '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTermLabel(term) {
  if (!term) return '';
  const sem = term.semester === 1 ? '1st Semester' : '2nd Semester';
  return `${sem}, Academic Year ${term.school_year}`;
}

function buildAchievementText(item, termLabel) {
  if (item.honor_type === 'top25_university') {
    return `for achieving Rank ${item.rank} among the Top 25 Academic Achievers of Pampanga State University &ndash; Sto. Tomas Campus during ${escHtml(termLabel)}.`;
  }
  const label = item.honor_type === 'presidents_list' ? "President&rsquo;s Lister" : "Dean&rsquo;s Lister";
  return `for his/her excellent academic performance as ${label} during ${escHtml(termLabel)}.`;
}

function ordinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatAwardedDate(value) {
  const date = value ? new Date(value) : new Date();
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${ordinalSuffix(day)} day of ${month} ${year}`;
}

async function loadAssetBase64(assetModule) {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  return FileSystem.readAsStringAsync(asset.localUri, { encoding: 'base64' });
}

function buildCertificateHtml({ studentName, item, termLabel, logoLeft, gradusLogo, logoRight, watermark, nameFont }) {
  const achievementText = buildAchievementText(item, termLabel);
  const dateLabel = formatAwardedDate(item.awarded_at);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @font-face {
    font-family:'CertScript';
    src:url(data:font/ttf;base64,${nameFont}) format('truetype');
    font-weight:normal;
    font-display:block;
  }
  /* IMPORTANT: 612pt is expo-print's own DEFAULT_MEDIA_HEIGHT constant on Android.
     Every OTHER custom height tried here (500/504/520/560/590/700) triggered a
     library bug (numberOfPages = 1 + floor(contentHeight/pageHeight)) that adds a
     spurious blank 2nd page — but 612 (matching the library's own default) reliably
     renders as a single page. Keep this at 612 and keep the design elements below
     (.frame/.watermark-wrap/etc) at a fixed, compact size well under that — do not
     "fix" perceived extra bottom margin by changing this number again without
     re-verifying via the adb/PDF-inspection approach documented in this file's
     conversation history, since this value has been extremely fragile. */
  @page { size:792pt 612pt; margin:0; }
  html, body { width:792pt; height:612pt; overflow:hidden; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background:#FDFAF3;
    position:relative;
    overflow:hidden;
  }
  .frame {
    position:absolute; top:16pt; left:16pt; right:16pt; height:468pt;
    border:2.5pt solid #7A1F2B;
    border-radius:6pt;
  }
  .top-strip {
    position:absolute; top:16pt; left:16pt; right:16pt; height:74pt;
    background:linear-gradient(90deg,#5A141E 0%,#7A1F2B 50%,#8F2A38 100%);
    border-radius:4pt 4pt 0 0;
    z-index:1;
  }
  .header-row {
    position:absolute; top:16pt; left:16pt; right:16pt; height:74pt;
    z-index:3;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 22pt;
  }
  .header-left { display:flex; align-items:center; gap:5pt; }
  .header-left-badge {
    width:26pt; height:26pt; border-radius:50%; overflow:hidden;
    background:#FFFFFF; display:flex; align-items:center; justify-content:center;
  }
  .header-left-badge img { width:140%; height:140%; object-fit:cover; }
  .header-center { position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); text-align:center; }
  .uni-name { font-size:12pt; font-weight:bold; color:#FFFFFF; letter-spacing:0.5pt; }
  .uni-campus { font-size:9pt; color:rgba(255,255,255,0.85); margin-top:1pt; }
  .header-right { flex:0 0 210pt; position:relative; height:100%; z-index:4; }
  .header-right-ribbon {
    position:absolute; left:50%; top:145pt; transform:translateX(-50%);
    width:84pt; height:90pt;
    background:linear-gradient(180deg,#8F2A38,#5A141E);
    clip-path:polygon(0 0,100% 0,100% 100%,50% 80%,0 100%);
    z-index:3;
  }
  .header-right-badge {
    position:absolute; left:50%; top:34pt; transform:translateX(-50%);
    width:130pt; height:130pt; border-radius:50%; overflow:hidden;
    background:#FFFFFF; z-index:5;
  }
  .header-right-badge img { width:145%; height:145%; object-fit:cover; margin:-22.5% 0 0 -22.5%; }
  .watermark-wrap {
    position:absolute; left:16pt; right:16pt; top:254pt; height:230pt;
    overflow:hidden;
  }
  .watermark-img {
    width:100%; height:100%; object-fit:cover; object-position:center top;
    display:block;
  }
  .watermark-tint {
    position:absolute; inset:0;
    background:linear-gradient(to bottom,
      rgba(253,250,243,1) 0%,
      rgba(253,250,243,0.6) 22%,
      rgba(122,31,43,0.3) 50%,
      rgba(122,31,43,0.62) 100%);
  }
  .content {
    position:absolute; top:0; left:0; right:0; height:500pt; z-index:2; overflow:hidden;
    padding:98pt 46pt 0 50pt;
  }
  .title { font-size:52pt; font-weight:bold; color:#1A1A1A; letter-spacing:1.5pt; }
  .subtitle {
    font-size:15pt; letter-spacing:5pt; color:#5A4632; font-weight:bold;
    margin-top:2pt;
  }
  .presented { font-size:11pt; color:#5A4632; letter-spacing:1.5pt; margin-top:16pt; }
  .name { font-family:'CertScript',cursive; font-size:72pt; color:#1A1A1A; line-height:1; margin-top:4pt; }
  .achievement { font-size:14pt; color:#333333; max-width:620pt; margin-top:14pt; line-height:1.6; }
  .given { font-size:12.5pt; color:#5A4632; max-width:620pt; margin-top:16pt; }
  .sig-block {
    position:absolute; right:56pt; top:433pt; width:210pt; text-align:center;
  }
  .sig-line { border-top:1pt solid #5A4632; height:1pt; }
  .sig-name { font-size:11pt; font-weight:bold; color:#1A1A1A; margin-top:6pt; }
  .sig-title { font-size:9pt; color:#5A4632; margin-top:2pt; }
</style>
</head>
<body>
  <div class="frame"></div>
  <div class="top-strip"></div>
  <div class="header-row">
    <div class="header-left">
      <div class="header-left-badge"><img src="data:image/jpeg;base64,${logoLeft}" /></div>
      <div class="header-left-badge"><img src="data:image/png;base64,${gradusLogo}" /></div>
      <div class="header-left-badge"><img src="data:image/jpeg;base64,${logoRight}" /></div>
    </div>
    <div class="header-center">
      <div class="uni-name">PAMPANGA STATE UNIVERSITY</div>
      <div class="uni-campus">Sto. Tomas Campus</div>
    </div>
    <div class="header-right">
      <div class="header-right-ribbon"></div>
      <div class="header-right-badge"><img src="data:image/jpeg;base64,${logoRight}" /></div>
    </div>
  </div>
  <div class="watermark-wrap">
    <img class="watermark-img" src="data:image/png;base64,${watermark}" />
    <div class="watermark-tint"></div>
  </div>

  <div class="content">
    <div class="title">CERTIFICATE</div>
    <div class="subtitle">OF RECOGNITION</div>

    <div class="presented">THIS CERTIFICATE IS PRESENTED TO</div>
    <div class="name">${escHtml(studentName)}</div>

    <div class="achievement">${achievementText}</div>

    <div class="given">Given this ${dateLabel} at Pampanga State University, Sto. Tomas Campus.</div>
  </div>

  <div class="sig-block">
    <div class="sig-line"></div>
    <div class="sig-name">JOVITA G. RIVERA, Ph.D.</div>
    <div class="sig-title">Campus Director</div>
  </div>
</body>
</html>`;
}

export async function getOrGenerateCertificateUrl(user, item) {
  if (item?.certificate_url) return { url: item.certificate_url, error: null };
  if (!user?.id || !item?.id) return { url: null, error: new Error('Missing user or honor record.') };

  try {
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('first_name, middle_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();
    if (sErr || !student) throw sErr || new Error('Student record not found.');

    const lastName = toTitleCase(student.last_name);
    const middleInitial = student.middle_name ? `${student.middle_name.trim().charAt(0).toUpperCase()}.` : '';
    const studentName = [`${lastName},`, student.first_name, middleInitial].filter(Boolean).join(' ');

    const [logoLeft, gradusLogo, logoRight, watermark, nameFont] = await Promise.all([
      loadAssetBase64(require('../../../../assets/images/formlogo/logoLeft.jpg')),
      loadAssetBase64(require('../../../../assets/images/gradus-logo-new.png')),
      loadAssetBase64(require('../../../../assets/images/formlogo/logoRight.jpg')),
      loadAssetBase64(require('../../../../assets/images/certificate_building_background.png')),
      loadAssetBase64(require('../../../../assets/fonts/AlexBrush-Regular.ttf')),
    ]);

    const termLabel = formatTermLabel(item.term);
    const html = buildCertificateHtml({ studentName, item, termLabel, logoLeft, gradusLogo, logoRight, watermark, nameFont });

    // expo-print's Android renderer computes numberOfPages = 1 + floor(contentHeight / pageHeight),
    // which off-by-ones to 2 pages whenever content height exactly matches the page height.
    // Requesting a page a hair taller than the CSS content (500pt) keeps the ratio safely under 1.
    const { uri } = await Print.printToFileAsync({ html, width: 792, height: 612, base64: false });
    const pdfBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

    const path = `${user.id}/${item.id}.pdf`;
    const { error: upErr } = await supabase.storage
      .from(CERTIFICATE_BUCKET)
      .upload(path, decode(pdfBase64), { contentType: 'application/pdf', upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(CERTIFICATE_BUCKET).getPublicUrl(path);
    const url = pub?.publicUrl;
    if (!url) throw new Error('Could not resolve certificate URL.');

    const { error: updateErr } = await supabase
      .from('academic_honors')
      .update({ certificate_url: url })
      .eq('id', item.id);
    if (updateErr) throw updateErr;

    return { url, localUri: uri, error: null };
  } catch (err) {
    return { url: null, localUri: null, error: err };
  }
}

export async function openCertificate({ url, localUri } = {}) {
  let fileUri = localUri;

  if (!fileUri) {
    if (!url) return;
    const dest = `${FileSystem.cacheDirectory}certificate-${Date.now()}.pdf`;
    const { uri } = await FileSystem.downloadAsync(url, dest);
    fileUri = uri;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Certificate of Recognition',
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri: fileUri });
  }
}
