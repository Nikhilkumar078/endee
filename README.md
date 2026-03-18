# HireSense AI 🚀

An adaptive AI-powered interview training platform with multi-agent intelligence, resume analysis, and personalized coaching.

## 🌟 Features

- **Multi-Agent Intelligence**: Powered by Google Gemini (Interviewer, Evaluator, and Coach agents).
- **Adaptive Mock Interviews**: Questions adapt based on your performance and identified weaknesses.
- **Continuous Speech Recognition**: Advanced voice-to-text with continuous listening mode for natural long-form answers.
- **Real-time Feedback**: Get instant feedback on your technical accuracy, communication, and confidence.
- **Resume Analysis**: Tailored interview questions based on your uploaded resume.
- **Personalized Coaching**: Actionable suggestions and summary reports for every session.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini API (@google/genai)
- **Animations**: Motion (framer-motion)
- **Icons**: Lucide React

## 📂 Project Structure

```text
├── src/
│   ├── components/       # Reusable UI components (InterviewRoom, Dashboard, etc.)
│   ├── services/         # Gemini AI and Firebase service logic
│   ├── firebase.ts       # Firebase initialization
│   ├── types.ts          # TypeScript interfaces and enums
│   ├── App.tsx           # Main application entry
│   └── index.css         # Global styles with Tailwind CSS
├── public/               # Static assets
├── firestore.rules       # Firebase security rules
├── firebase-blueprint.json # Database structure definition
└── package.json          # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd hiresense-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Firebase Setup**:
   Ensure your `firebase-applet-config.json` is correctly configured with your project details.

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🎙️ Speech Recognition Note

The application uses the Web Speech API. For the best experience, please use **Google Chrome**. The system is optimized for continuous listening, allowing you to give detailed answers without interruption.

## 📄 License

This project is licensed under the MIT License.
