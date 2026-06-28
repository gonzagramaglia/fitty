# Figma AI UI Prompts for Fitty

This document contains prompts designed to be copy-pasted into Figma AI (or any other UI generation AI like v0.dev or Galileo AI) to create the base screens for the application.

## General Design Guidelines (Vibe Check)
**Global prompt to provide context to the AI before requesting specific screens:**
> "Design a modern, premium mobile application for iOS and Android. The aesthetic should be clean, minimalist, and highly trustworthy, similar to Apple Health or a high-end vet clinic app. MUST USE the following strict brand color palette: Primary warm accent is #FDCA6E, Primary cool accent is #74B7B5, Secondary cool accent is #9CD4CE, and the main dark text/UI element color is #1A303F. Use a clean white/off-white background for the main canvas. Use rounded corners (bento-box style), smooth drop shadows, and modern typography (like Inter or SF Pro). The app is called 'Fitty'."

---

## Screen 0: Onboarding & Login
**Prompt:**
> "Design a 2-part mobile app Onboarding and Login experience for a cat health app called 'Fitty'. 
> First, show a beautiful Onboarding screen with an illustration of a cat and text explaining 'Understand your cat's health using AI'. Include a 'Next' button and pagination dots.
> 
> Below that (or on the final onboarding step), design a very clean Login area. There should be NO email or password fields. Instead, feature a large, prominent 'Continue with Google' button. Crucially, add a highly visible secondary button that says 'Continue as Guest (Judge Mode)'. This is to allow hackathon judges to enter the app without friction."

---

## Screen 1: Dashboard (Home)
**Prompt:**
> "Design a mobile app Dashboard screen for a cat health tracking app called 'Fitty'. At the top, show a welcoming header with the user's avatar. Below the header, display a prominent 'Cat Profile Card' showing the cat's name (e.g., 'Luna'), a placeholder photo, and basic stats (Age: 3, Weight: 4.5kg). 
> 
> Include a large, highly visible primary Call-to-Action (CTA) button that says 'Start AI Health Check' with a camera or sparkle icon. 
> 
> Below the button, create a 'Recent History' section listing past health checks with dates and a small badge showing the 'BCS Score' (e.g., 'BCS: 5 - Ideal'). Use a bottom navigation bar with icons for: Home, Camera, History, and Profile."

---

## Screen 2: Incomplete Profile State (Dashboard Variation)
**Prompt:**
> "Design a variation of the mobile app Dashboard. This time, the cat's profile is missing critical data (like base weight). Show a prominent, friendly warning banner at the top of the screen saying 'Incomplete Profile: Please add Luna's base weight to enable AI health checks.' The 'Start AI Health Check' button should be visibly disabled or grayed out until the profile is completed."

---

## Screen 3: Camera Capture (Top View)
**Prompt:**
> "Design a mobile app camera screen for capturing a photo of a cat from above. The screen should show a live camera feed taking up the full screen. Overlay a semi-transparent, dotted, or glowing silhouette of a cat viewed from the top to guide the user on how to align their pet. 
> 
> Add clear, large text at the top: 'Step 1: Top View. Align your cat within the silhouette.' 
> 
> At the bottom, include a large circular shutter button, a flash toggle icon, and a 'Cancel' button."

---

## Screen 4: Voice Note & Processing
**Prompt:**
> "Design a mobile app screen for recording a voice note about a cat's current health. The layout should be clean and focus on a large, glowing microphone button in the center. Above the button, add text: 'Step 3: Tell us how Luna is feeling today (Optional)'. 
> 
> Provide a secondary state (or bottom sheet) showing a 'Processing...' loading screen with a modern, fluid animation or skeleton loader, with text saying 'Fitty AI is analyzing Luna's photos and audio...'"

---

## Screen 5: AI Results & Recommendations
**Prompt:**
> "Design a mobile app Results screen showing an AI-generated health report for a cat. At the top, display a large, visual 'Body Condition Score (BCS)' gauge or circular progress indicator showing a score of '6 out of 9 (Overweight)'. 
> 
> Below the score, include a card titled 'AI Reasoning' with a paragraph of text explaining the visual cues found in the photos. 
> 
> Below that, include a 'Recommendations' section with a list of 3 actionable tips (e.g., 'Adjust diet portions', 'Increase playtime'). Use a clean, bento-box card layout. Add a 'Save to History' primary button at the bottom."

---

## Screen 6: Cat Profile Management (Multi-Cat Support)
**Prompt:**
> "Design a mobile app Settings/Profile screen to manage cat details. At the very top, include a horizontal scrolling list (avatars) or a sleek dropdown to easily switch between multiple cats (e.g., 'Luna', 'Milo', '+ Add New Cat'). 
> 
> Below the cat selector, include an area to upload a circular avatar photo for the selected cat. Include modern, clean text input fields for: 'Cat's Name', 'Breed', 'Age (years)', and a numeric input for 'Base Weight (kg)'. Add a 'Save Profile' primary button at the bottom. Use clear labels and subtle borders for the inputs."
