<div align="center">

<img src="assets/images/logo.png" alt="CampusIQ Logo" width="120"/>

# CampusIQ

### The ultimate intelligent campus companion — manage academics, track attendance, and chat with your AI assistant.

[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-51.x-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![AWS Bedrock](https://img.shields.io/badge/AWS_Bedrock-GenAI-FF9900?logo=amazonwebservices&logoColor=white)](https://aws.amazon.com/bedrock/)
[![Strands SDK](https://img.shields.io/badge/Strands_Agents-SDK-blue?logo=awsorganizations&logoColor=white)](https://github.com/awslabs/strands-agents)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 Overview

**CampusIQ** is a comprehensive, AI-powered academic management platform designed to streamline the student experience. By centralizing timetable scheduling, attendance tracking, SGPA forecasting, and assignment management, CampusIQ eliminates the friction of university life. 

What truly sets CampusIQ apart is its **Local AI Agent**, built entirely on the open-source AWS Strands Agents SDK and powered by AWS Bedrock. This context-aware assistant securely reads your local academic data to answer questions like *"How many classes can I skip today?"* or *"What is my predicted SGPA if I score an A in Physics?"* — providing instant, personalized insights.

---

## 🎥 Video Demo

<div align="center">
  <video src="[INSERT_DEMO_VIDEO_LINK_HERE]" controls="controls" style="max-width: 100%; height: auto;"></video>
  <p><em>(Replace with your 3-minute hackathon demo video link)</em></p>
</div>

---

## 📸 Screenshots

<div align="center">
  <img src="[INSERT_SCREENSHOT_1_URL]" width="24%" alt="Home Screen"/>
  <img src="[INSERT_SCREENSHOT_2_URL]" width="24%" alt="Attendance Tracker"/>
  <img src="[INSERT_SCREENSHOT_3_URL]" width="24%" alt="SGPA Predictor"/>
  <img src="[INSERT_SCREENSHOT_4_URL]" width="24%" alt="AI Assistant Chat"/>
</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **Context-Aware AI Assistant** | Ask natural language questions about your schedule, attendance, and grades, powered by AWS Bedrock and Strands SDK. |
| 📊 **Smart Attendance Tracking** | Log classes in real-time. The app calculates your current percentage and tells you exactly how many classes you can afford to miss. |
| 📅 **Dynamic Timetable** | Interactive weekly and monthly calendar views to track upcoming lectures, labs, and extra classes. |
| 📈 **SGPA Forecaster** | Play with a "What-If" grading wizard. Adjust expected grades on a glass-slider to predict your semester SGPA. |
| 📝 **Assignment & Exam Manager** | Never miss a deadline. Track pending assignments, due dates, and upcoming midterms/finals with priority tagging. |
| 🎨 **Premium UI/UX** | Stunning glassmorphism design, smooth micro-animations, rich haptic feedback, and a fully customizable subject color palette. |
| 🔒 **Local-First Privacy** | Your academic data stays on your device using encrypted local storage (Zustand + AsyncStorage). |
| ☁️ **AWS Open Source Integration** | The entire agent architecture runs locally, leveraging the Strands framework to orchestrate LLM calls and tool execution. |

---

## 🛠️ Tech Stack

### Frontend (Mobile App)

| Technology | Purpose |
|---|---|
| **React Native (Expo)** | Cross-platform mobile framework (iOS/Android) |
| **TypeScript** | Strongly typed application language |
| **Zustand** | Lightweight, reactive state management |
| **Expo Router** | File-based routing and navigation |
| **Reanimated & Moti** | Fluid gesture handling and 60fps animations |
| **AsyncStorage** | Persistent local data storage |

### Backend (Agent Server)

| Technology | Purpose |
|---|---|
| **Node.js + Express** | High-performance API server |
| **AWS Bedrock SDK** | Foundation Model access for AI inference |
| **Strands Agents SDK** | Agentic orchestration, tool binding, and multi-turn reasoning |
| **Zod** | Runtime schema validation for AI inputs/outputs |
| **dotenv** | Environment variable management |

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Styling
    classDef mobile fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1,rx:5,ry:5
    classDef server fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20,rx:5,ry:5
    classDef aws fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#E65100,rx:5,ry:5
    classDef data fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px,color:#4A148C,rx:5,ry:5

    subgraph Client [📱 Mobile Application (Expo)]
        UI[React Native UI]:::mobile
        State[Zustand Local Store]:::data
        UI <--> State
    end

    subgraph Backend [🖥️ Agent Server (Node.js)]
        API[Express API]:::server
        Strands[Strands Agents SDK]:::server
        Tools[Custom Agent Tools]:::server
        
        API <--> Strands
        Strands <--> Tools
    end

    subgraph Cloud [☁️ AWS Infrastructure]
        Bedrock[AWS Bedrock Foundation Models]:::aws
        IAM[AWS IAM Auth]:::aws
    end

    UI -- "REST (Context + Query)" --> API
    Strands -- "Model Inference" --> Bedrock
    Bedrock -. "Auth" .- IAM
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Expo CLI
- AWS Account (with Bedrock Model Access enabled)

### 1. Clone the repository
```bash
git clone https://github.com/priyanshusharan-cmd/campusiq.git
cd campusiq
```

### 2. Start the Agent Server (Backend)
```bash
cd agent-server
npm install

# Create your .env file
cp .env.example .env

# Add your AWS credentials and region to the .env file
# Start the server
npm run dev
```

### 3. Start the Mobile App (Frontend)
Open a new terminal window:
```bash
# From the root directory
npm install
npx expo start
```
Scan the QR code with your Expo Go app (iOS/Android) or press `i` to open the iOS simulator.

---

## 🏆 Hackathon Submission Details (AWS First Commit)

- **Track:** Build It (Agents and AI)
- **Problem Solved:** Fragmented student data leading to missed classes, chaotic deadlines, and unpredictable grades. CampusIQ centralizes this into a single, intelligent interface.
- **AWS Usage:** 
  - **AWS Open Source:** Leveraged the **Strands Agents SDK** to orchestrate our AI assistant.
  - **AWS Cloud:** Utilized **AWS Bedrock** to securely access Foundation Models for the agent's reasoning engine.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
