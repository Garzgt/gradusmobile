# Student Registration and Dashboard Access

This guide explains how all students register and access the GRADUS mobile app.

Reference documents:
- [../../gradus_info.txt](../../gradus_info.txt)
- [../Color-Scheme.md](../Color-Scheme.md)

## 1. Overview

All students follow the same registration and dashboard access flow.
The system does not classify or label students as fresh, regular, irregular, or transferee.

## 2. Authentication

- Google Sign-In only.
- Only PSU institutional email accounts are accepted: @pampangastateu.edu.ph
- No personal or external email allowed.
- Student number is automatically extracted from the email prefix.
  - Example: 2023309289@pampangastateu.edu.ph → Student Number: 2023309289
  - Student number is never manually entered.

## 3. New Student — Profile Completion

If the student is signing in for the first time:

1. Student opens GRADUS and taps Google Sign-In.
2. Student authenticates with their PSU Google account.
3. App detects the account is not yet registered.
4. Student is directed to the profile completion screen.
5. Student fills in:
   - First Name
   - Middle Name
   - Last Name
   - Program (BSIT, BSBA, BEED, BSHM)
   - Contact Number
6. Student submits the form.
7. Student is directed to the dashboard.

## 4. Existing Student — Direct Dashboard Access

If the student has already registered:

1. Student opens GRADUS and taps Google Sign-In.
2. Student authenticates with their PSU Google account.
3. App recognizes the account.
4. Student is directed directly to the dashboard.

No scan, no classification, no additional prompts.

## 5. Dashboard

All students land on the same dashboard. From here they can:

- Access the advising feature (recommended for irregular students).
- View published schedule.
- View posted grade components in realtime.
- View grades.
- View honor status.

## 6. Enrollment (Outside GRADUS)

GRADUS does not handle enrollment directly.

All students:
- Submit a Letter of Intent (LOI) through a Google Drive link provided by the institution.
- Main campus processes the LOI and creates the official classlist.
- Teacher imports the classlist via Excel into GRADUS Desktop.
- Subjects appear in GRADUS after the teacher import is complete.

Students who need the advising feature also:
- Submit the printed advising form to the program coordinator before the LOI.
- Coordinator forwards the form together with the LOI to main campus.

## 7. Edge Cases

1. No active term available:
   - Student can complete registration and view dashboard but no subjects appear until a term is active.
2. Teacher import delayed:
   - Student remains in waiting state until import completes.
3. Email domain not accepted:
   - App blocks sign-in and shows domain restriction message.

## 8. Summary

Student entry flow:
- Google Sign-In with PSU account → new student: profile completion → existing student: direct to dashboard → access advising feature if needed → submit LOI via Google Drive → teacher Excel import → subjects appear in GRADUS.
