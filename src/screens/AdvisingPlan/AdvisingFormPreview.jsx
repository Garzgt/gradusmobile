import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabase';
import ScheduleGrid from './components/ScheduleGrid';
import CourseTableView from './components/CourseTableView';

const FALLBACK_COLOR = { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' };

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

function colorFromHex(hex) {
  if (!hex) return null;
  if (!hexToRgb(hex)) return null;
  return { bg: hex, text: '#111111', border: hex };
}

const DAY_MAP = { 1: 'M', 2: 'T', 3: 'W', 4: 'TH', 5: 'F', 6: 'SA' };

function formatTime12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':').map(Number);
  const hour = h % 12 || 12;
  const min = String(m || 0).padStart(2, '0');
  return `${hour}:${min}`;
}

function ordinalUpper(n) {
  const num = Number(n);
  if (num === 1) return '1ST';
  if (num === 2) return '2ND';
  if (num === 3) return '3RD';
  return `${num}TH`;
}

function buildFormHtml({ student, userEmail, termSemester, schoolYear, courseRows, totalUnits, logoLeft, logoRight }) {
  const semLabel = termSemester === 1
    ? '1ST SEMESTER'
    : termSemester === 2
    ? '2ND SEMESTER'
    : 'SEMESTER';
  const ayLabel = schoolYear ? `ACADEMIC YEAR ${schoolYear}` : '';

  const lastName = (student?.last_name || '').toUpperCase();
  const firstName = student?.first_name || '';
  const middleName = student?.middle_name || '';
  const fullPrintedName = [lastName, firstName, middleName ? `${middleName[0]}.` : '']
    .filter(Boolean).join(', ').replace(', ,', ',');
  const yearLevel = student?.current_year_level ? `${ordinalUpper(student.current_year_level)} YEAR` : '';
  const programCode = student?.programs?.code || '';
  const studentNumber = student?.student_number || '';
  const contactNumber = student?.contact_number || '';
  const email = student?.email || userEmail || '';

  const rowsHtml = courseRows.map((row) => `
    <tr>
      <td class="code-cell">${escHtml(row.code)}</td>
      <td class="title-cell">${escHtml(row.title)}</td>
      <td class="units-cell">${escHtml(String(row.units))}</td>
      <td class="section-cell">${escHtml(row.section)}</td>
      <td class="schedule-cell">${escHtml(row.schedule)}</td>
    </tr>`).join('');

  const padCount = Math.max(3, 8 - courseRows.length);
  const emptyRows = Array.from({ length: padCount }).map(() =>
    '<tr><td class="code-cell">&nbsp;</td><td class="title-cell"></td><td class="units-cell"></td><td class="section-cell"></td><td class="schedule-cell"></td></tr>'
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:10pt; padding:28px 36px; color:#000; }

  .university { font-size:13pt; font-weight:bold; }
  .form-title { font-size:12pt; font-weight:bold; text-decoration:underline; margin-top:10px; }
  .term-title { font-size:12pt; font-weight:bold; text-decoration:underline; }

  .section-label { font-weight:bold; font-size:10pt; margin:10px 0 3px; }

  table { width:100%; border-collapse:collapse; font-size:9.5pt; }
  td { border:1px solid #000; padding:4px 6px; vertical-align:middle; }
  .lbl { font-weight:bold; font-size:9.5pt; }
  .italic { font-style:italic; font-size:8pt; }

  .code-cell  { width:18%; font-weight:bold; }
  .title-cell { }
  .units-cell { width:9%;  text-align:center; }
  .section-cell   { width:10%; text-align:center; }
  .schedule-cell  { width:20%; text-align:center; font-size:8.5pt; }
  .total-label { text-align:right; font-weight:bold; }
  .total-units { text-align:center; font-weight:bold; font-size:12pt; }

  .disclaimer { font-size:8.5pt; margin:10px 0; line-height:1.6; }
  .disclaimer ol { padding-left:18px; margin-top:4px; }
  .disclaimer li { margin-bottom:3px; }

  .sig-table td { border:none; text-align:center; padding:0 10px; }
  .sig-line { border-top:1px solid #000; margin-top:38px; padding-top:3px; }

  .divider { text-align:center; font-size:8pt; border-top:1px dashed #000; margin:14px 0 8px; padding-top:3px; }

  .personnel-box { border:1px solid #000; margin-bottom:8px; }
  .personnel-header { border-bottom:1px solid #000; text-align:center; font-weight:bold; font-size:9pt; padding:4px; }
  .personnel-body { font-size:8.5pt; padding:6px 8px; line-height:1.5; }
  .personnel-sig td { border:none; text-align:center; padding:0 10px; }
  .personnel-sig-line { border-top:1px solid #000; margin-top:30px; padding-top:3px; }

  .approved-table td { border:none; }
  .approved-left  { width:50%; text-align:center; border-right:1px solid #000 !important; }
  .approved-right { width:50%; text-align:center; }

</style>
</head>
<body>

<table style="border:none;width:100%;margin-bottom:6px;">
  <tr>
    <td style="border:none;width:90px;text-align:center;vertical-align:middle;padding-left:4px;padding-right:14px;">
      ${logoLeft ? `<img src="data:image/jpeg;base64,${logoLeft}" style="width:72px;height:72px;object-fit:contain;" />` : ''}
    </td>
    <td style="border:none;text-align:center;vertical-align:middle;">
      <p style="font-size:8.5pt">Republic of the Philippines</p>
      <p class="university">PAMPANGA STATE UNIVERSITY</p>
      <p style="font-size:8.5pt">Bacolor, Pampanga</p>
      <p class="form-title">PRE-REGISTRATION FORM</p>
      <p class="term-title">${semLabel}, ${ayLabel}</p>
    </td>
    <td style="border:none;width:90px;text-align:center;vertical-align:middle;padding-right:4px;padding-left:14px;">
      ${logoRight ? `<img src="data:image/jpeg;base64,${logoRight}" style="width:72px;height:72px;object-fit:contain;" />` : ''}
    </td>
  </tr>
</table>

<p class="section-label">I. DEMOGRAPHIC INFORMATION</p>
<table>
  <tr>
    <td style="width:30%" class="lbl">Student Number</td>
    <td style="width:50%" class="lbl">Program of Study and Major</td>
    <td style="width:20%" class="lbl">Year Level</td>
  </tr>
  <tr>
    <td style="text-align:center">${escHtml(studentNumber)}</td>
    <td style="text-align:center;font-weight:bold">${escHtml(programCode)}</td>
    <td style="text-align:center"></td>
  </tr>
  <tr><td colspan="3" class="lbl">Name of Student</td></tr>
  <tr>
    <td style="text-align:center;padding:6px 4px">
      <div>${escHtml(lastName)}</div>
      <div class="italic">Family Name</div>
    </td>
    <td style="text-align:center;padding:6px 4px">
      <div>${escHtml(firstName)}</div>
      <div class="italic">Given Name</div>
    </td>
    <td style="text-align:center;padding:6px 4px">
      <div>${escHtml(middleName || '')}</div>
      <div class="italic">Middle Name</div>
    </td>
  </tr>
  <tr><td colspan="3" class="lbl">Contact Details</td></tr>
  <tr>
    <td style="text-align:center;padding:6px 4px">
      <div>${escHtml(contactNumber || '')}</div>
      <div class="italic">Primary Mobile Number</div>
    </td>
    <td style="text-align:center;padding:6px 4px">
      <div>&nbsp;</div>
      <div class="italic">Secondary Mobile Number</div>
    </td>
    <td style="text-align:center;padding:6px 4px">
      <div>&nbsp;</div>
      <div class="italic">Active Email Address</div>
    </td>
  </tr>
</table>

<p class="section-label">II. ENROLLMENT DETAILS</p>
<table>
  <tr>
    <td class="code-cell lbl" style="text-align:center">Course Code</td>
    <td class="title-cell lbl" style="text-align:center">Course Title</td>
    <td class="units-cell lbl">Credit<br>Units</td>
    <td class="section-cell lbl">Section</td>
    <td class="schedule-cell lbl">Schedule/<br>Room</td>
  </tr>
  ${rowsHtml}
  ${emptyRows}
  <tr>
    <td class="code-cell"></td>
    <td class="title-cell total-label">Total Units</td>
    <td class="units-cell total-units">${totalUnits}</td>
    <td class="section-cell"></td>
    <td class="schedule-cell"></td>
  </tr>
</table>

<div class="disclaimer">
  <p>By signing this document:</p>
  <ol>
    <li>I fully understand and agree that the information above are true and correct; and that any false statement on this document (as well as on the supporting documents) constitutes a perjury and could result in denial of the registration and disciplinary proceedings with sanction as per the Pampanga State University (the &ldquo;University&rdquo;) policies;</li>
    <li>I am fully aware and understand that registration/enrollment in any course for the abovementioned academic period is allowed only upon passing the pre-requisite(s) of the said course (if any); a course registered/enrolled in violation of this rule will not be given any credit regardless of the grade obtained;</li>
    <li>I authorize the University to collect and process any information declared herein with utmost confidentiality; and</li>
    <li>I allow the University to disclose the collected information to its affiliates and lawful third parties for legitimate purposes only.</li>
  </ol>
</div>

<table class="sig-table" style="margin-top:10px">
  <tr>
    <td style="width:60%">
      <div class="sig-line">${escHtml(fullPrintedName)}</div>
      <div class="italic">Signature over printed name of Student</div>
    </td>
    <td style="width:40%">
      <div class="sig-line"></div>
      <div class="italic">Date signed by the Student</div>
    </td>
  </tr>
</table>

<div class="divider">---------------------------------------------------------FOR DHVSU PERSONNEL ONLY---------------------------------------------------------</div>

<div class="personnel-box">
  <div class="personnel-header">Recommending Approval</div>
  <div class="personnel-body">By signing this document I, hereby, declare that I have fully assessed the status of the student and advised him/her with the appropriate courses to enroll in the academic period stated above.</div>
  <table class="personnel-sig" style="margin-top:6px">
    <tr>
      <td style="width:60%">
        <div class="personnel-sig-line"></div>
        <div class="italic">Signature over printed name of Program Chairperson</div>
      </td>
      <td style="width:40%">
        <div class="personnel-sig-line"></div>
        <div class="italic">Date recommended for approval</div>
      </td>
    </tr>
  </table>
</div>

<div class="personnel-box">
  <table class="approved-table">
    <tr>
      <td class="approved-left lbl" style="font-weight:bold;text-align:center;padding:4px 8px;border-right:1px solid #000">Approved by</td>
      <td class="approved-right lbl" style="font-weight:bold;text-align:center;padding:4px 8px">Date approved</td>
    </tr>
    <tr>
      <td class="approved-left" style="text-align:center;padding:0 10px;border-right:1px solid #000">
        <div class="personnel-sig-line"></div>
        <div class="italic">Signature over printed name of College Dean</div>
      </td>
      <td class="approved-right" style="text-align:center;padding:0 10px">
        <div style="margin-top:30px"></div>
      </td>
    </tr>
  </table>
</div>

</body>
</html>`;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function AdvisingFormPreview() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const alert = useAlert();
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const {
    assigned = [],
    unscheduled = [],
    termLabel = '',
    termId = null,
    termSemester = null,
    schoolYear = '',
  } = route.params || {};

  const subjectColors = useMemo(() => {
    const map = {};
    assigned.forEach((entry) => {
      const key = entry._subjectCode || entry.subjects?.subject_code;
      if (key && !map[key]) {
        map[key] = colorFromHex(entry.subjects?.color_hex) || FALLBACK_COLOR;
      }
    });
    return map;
  }, [assigned]);

  const totalUnits = useMemo(() => {
    const seen = new Set();
    return assigned.reduce((sum, e) => {
      const key = e._subjectCode || e.subjects?.subject_code;
      if (seen.has(key)) return sum;
      seen.add(key);
      return sum + (Number(e.subjects?.credit_units) || 0);
    }, 0);
  }, [assigned]);

  const handleGenerateForm = () => {
    alert.show({
      type: 'info',
      title: 'Generate Pre-Registration Form',
      message: 'This creates a printable PDF of your advising plan to physically submit to your coordinator.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate PDF', onPress: doGenerateForm },
      ],
    });
  };

  const doGenerateForm = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: student, error: sErr } = await supabase
        .from('students')
        .select('id, student_number, first_name, middle_name, last_name, contact_number, email, current_year_level, programs(code, name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sErr || !student) throw new Error('Student record not found.');

      const seen = new Set();
      const selectedOfferings = assigned
        .filter((e) => {
          const key = e._subjectCode || e.subjects?.subject_code;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((e) => ({
          schedule_entry_id: e.id,
          subject_code: e.subjects?.subject_code || e._subjectCode,
          subject_title: e.subjects?.title,
          section_code: e.sections?.section_code,
          teacher: e.teachers
            ? `${e.teachers.first_name || ''} ${e.teachers.last_name || ''}`.trim()
            : null,
          day_of_week: e.day_of_week,
          start_time: e.start_time,
          end_time: e.end_time,
          credit_units: e.subjects?.credit_units,
        }));

      if (termId) {
        await supabase.from('advising_plans').upsert(
          {
            student_id: student.id,
            term_id: termId,
            selected_offerings: selectedOfferings,
            has_conflicts: unscheduled.length > 0,
            conflict_details: unscheduled.map((u) => ({ subject_code: u.subjectCode, reason: u.reason })),
            status: 'form_generated',
            form_generated_at: new Date().toISOString(),
          },
          { onConflict: 'student_id,term_id' },
        );
      }

      let logoLeft = null;
      let logoRight = null;
      try {
        const leftAsset = Asset.fromModule(require('../../../assets/images/formlogo/logoLeft.jpg'));
        const rightAsset = Asset.fromModule(require('../../../assets/images/formlogo/logoRight.jpg'));
        await Promise.all([leftAsset.downloadAsync(), rightAsset.downloadAsync()]);
        [logoLeft, logoRight] = await Promise.all([
          FileSystem.readAsStringAsync(leftAsset.localUri, { encoding: 'base64' }),
          FileSystem.readAsStringAsync(rightAsset.localUri, { encoding: 'base64' }),
        ]);
      } catch {
        // continue without logos
      }

      const subjectMap = {};
      assigned.forEach((entry) => {
        const code = entry._subjectCode || entry.subjects?.subject_code;
        if (!subjectMap[code]) {
          subjectMap[code] = { entries: [], subject: entry.subjects, section: entry.sections };
        }
        subjectMap[code].entries.push(entry);
      });

      const courseRows = Object.entries(subjectMap).map(([code, { entries, subject, section }]) => {
        const days = [...new Set(
          entries.map((e) => DAY_MAP[e.day_of_week]).filter(Boolean),
        )].join('/');
        const start = formatTime12(entries[0]?.start_time);
        const end = formatTime12(entries[0]?.end_time);
        const venue = entries[0]?.venues?.name || '';
        const timeStr = start && end ? `${start}-${end}` : '';
        const schedule = [days && timeStr ? `${days} ${timeStr}` : days || timeStr, venue]
          .filter(Boolean).join(' ');

        const lec = subject?.lec_units;
        const lab = subject?.lab_units;
        const credit = subject?.credit_units;
        const units =
          lec != null && lab != null && Number(lab) > 0
            ? `${lec}(${lab})`
            : credit ?? '—';

        return {
          code: subject?.subject_code || code,
          title: subject?.title || '',
          units,
          section: section?.section_code || '',
          schedule,
        };
      });

      const formTotalUnits = Object.values(subjectMap).reduce(
        (sum, { subject }) => sum + (Number(subject?.credit_units) || 0), 0,
      );

      const html = buildFormHtml({
        student,
        userEmail: user?.email,
        termSemester,
        schoolYear,
        courseRows,
        totalUnits: formTotalUnits,
        logoLeft,
        logoRight,
      });

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Pre-Registration Form',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (err) {
      toast.show({ type: 'error', title: 'Error', message: err.message || 'Could not generate form. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>ADVISING</Text>
        <Text style={styles.headerTitle}>Form Preview</Text>
        <Text style={styles.headerSub}>{termLabel || 'Active Term'}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{assigned.length}</Text>
            <Text style={styles.summaryLbl}>Scheduled</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{totalUnits}</Text>
            <Text style={styles.summaryLbl}>Total Units</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, unscheduled.length > 0 && styles.summaryNumWarn]}>
              {unscheduled.length}
            </Text>
            <Text style={styles.summaryLbl}>Unscheduled</Text>
          </View>
        </View>

        {assigned.length > 0 && (
          <>
            <View style={{ height: 10 }} />
            <ScheduleGrid entries={assigned} subjectColors={subjectColors} />
            <View style={{ height: 8 }} />
            <CourseTableView assigned={assigned} subjectColors={subjectColors} />
          </>
        )}

        {unscheduled.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>COULD NOT BE SCHEDULED</Text>
            <View style={styles.warnBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#B7770D" />
              <Text style={styles.warnText}>
                {unscheduled.length} subject{unscheduled.length > 1 ? 's' : ''} could not be
                fitted. Coordinate with your adviser.
              </Text>
            </View>
            {unscheduled.map((item, i) => (
              <View key={i} style={styles.unscheduledRow}>
                <View style={styles.codeTagWarn}>
                  <Text style={styles.codeTextWarn}>{item.subjectCode}</Text>
                </View>
                <Text style={styles.unscheduledReason} numberOfLines={2}>
                  {item.reason}
                </Text>
              </View>
            ))}
          </>
        )}

        {assigned.length === 0 && unscheduled.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="document-outline" size={32} color="#C8DFF0" />
            <Text style={styles.emptyTitle}>No plan generated</Text>
            <Text style={styles.emptyText}>
              Go back and select subjects to build your plan.
            </Text>
          </View>
        )}

        {assigned.length > 0 && (
          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={handleGenerateForm}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Ionicons name="print-outline" size={18} color="#FFFFFF" />
            }
            <Text style={styles.generateText}>
              {generating ? 'Generating...' : 'Generate Pre-Registration Form'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3c5e' },
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(42,122,182,0.18)',
    top: -60,
    right: -40,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  scroll: { flex: 1, backgroundColor: '#F2F6FA' },
  content: { paddingHorizontal: 16, paddingTop: 10 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 2,
    marginBottom: 4,
    marginTop: 8,
    marginLeft: 2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a3c5e',
    letterSpacing: -0.5,
  },
  summaryNumWarn: { color: '#B7770D' },
  summaryLbl: { fontSize: 11, color: '#8BA4BC', fontWeight: '500' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#EEF4FA' },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FDEBD0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  warnText: { flex: 1, fontSize: 12, color: '#B7770D', lineHeight: 17 },
  unscheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F0B429',
  },
  codeTagWarn: {
    backgroundColor: '#FDEBD0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  codeTextWarn: { fontSize: 11, fontWeight: '700', color: '#B7770D' },
  unscheduledReason: { fontSize: 11, color: '#8BA4BC', flex: 1 },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A2A3A' },
  emptyText: { fontSize: 12, color: '#8BA4BC', textAlign: 'center' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1a3c5e',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
