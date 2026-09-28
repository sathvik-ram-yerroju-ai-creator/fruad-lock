'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  BookOpen,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SafetyLesson } from '@/types/scam';

const SAFETY_LESSONS: SafetyLesson[] = [
  {
    id: 'lesson-upi-qr',
    title: 'UPI & QR Code Reverse Payment Traps',
    category: 'UPI & Payments',
    readTimeMinutes: 2,
    summary: 'Fraudsters trick victims on OLX, WhatsApp, or market apps into entering their UPI PIN under the claim of "receiving" a payment or cashback.',
    scamMechanism: 'The scammer generates an outbound payment collect request or pre-filled debit QR code. The victim scans it expecting funds to enter their account, enters their UPI PIN, and money is immediately debited.',
    redFlags: [
      'Buyer insists on sending advance payment via QR code',
      'Instruction says "Scan and enter your PIN to claim refund"',
      'Screenshots of payment failures sent to convince you to authorize a collect request',
    ],
    safeRules: [
      'RULE #1: You NEVER need to enter your UPI PIN to receive money. UPI PIN is exclusively for DEBIT.',
      'Never scan QR codes sent over chat.',
      'Reject all unsolicited collect requests on PhonePe, GPay, and Paytm.',
    ],
    realWorldScenario: 'Ramesh posted furniture for sale on OLX. A "buyer" agreed to pay ₹8,000 immediately, sent a QR code saying "Scan this in PhonePe to receive ₹8,000". Ramesh scanned and entered PIN — ₹8,000 was deducted from his account.',
    quiz: {
      question: 'When do you need to enter your UPI PIN?',
      options: [
        'Only when sending money or paying a merchant',
        'When receiving cashback from a bank',
        'When a buyer sends you advance money',
        'To verify your bank account on WhatsApp',
      ],
      correctIndex: 0,
      explanation: 'UPI PIN is strictly required only when you are initiating a transfer OUT of your account. You NEVER need a PIN to receive incoming credits.',
    },
  },
  {
    id: 'lesson-electricity-cut',
    title: 'Electricity & Utility Disconnection Threat',
    category: 'Urgency & Fear Appeals',
    readTimeMinutes: 2,
    summary: 'Panic-inducing SMS messages claiming your power will be cut tonight at 9:30 PM unless you call a specific mobile number.',
    scamMechanism: 'Sent from personal 10-digit phone numbers. When called, the fake officer instructs you to download an app (AnyDesk) or pay a ₹10 recharge fee on a phishing portal.',
    redFlags: [
      'Sent from an ordinary mobile number, not an official discom alphanumeric header',
      'Artificial countdown panic ("power cut tonight at 9:30 PM")',
      'Personal officer contact number provided in SMS text',
    ],
    safeRules: [
      'Legitimate electricity boards never cut power at night without statutory written notices.',
      'Never call mobile numbers provided in unverified SMS.',
      'Always check bill dues directly inside your official state electricity board portal.',
    ],
    realWorldScenario: 'Pooja received an SMS at 7:00 PM: "Dear consumer, electricity bill unpaid. Power cut at 9:30 PM. Call officer 98xxxxxx." Panicked, she called. The fake officer asked her to install QuickSupport to verify ₹10 payment, resulting in ₹45,000 stolen.',
    quiz: {
      question: 'What is the correct action if you receive an urgent power cut SMS?',
      options: [
        'Call the officer number given in the text immediately',
        'Download AnyDesk as instructed by the caller',
        'Check your account status directly on the official electricity discom portal',
        'Send money to the phone number via UPI',
      ],
      correctIndex: 2,
      explanation: 'Never trust contact details in unsolicited SMS. Always check your actual billing balance on your utility provider’s verified website or physical bill.',
    },
  },
  {
    id: 'lesson-remote-access',
    title: 'Remote Screen-Sharing Apps (AnyDesk, QuickSupport)',
    category: 'Device Takeover',
    readTimeMinutes: 3,
    summary: 'Scammers impersonating bank, telecom, or IT support trick victims into installing legitimate remote administration software to hijack device control.',
    scamMechanism: 'Once the 9-digit code is provided, the scammer views the victim screen in real time, monitors incoming OTP SMS messages, and executes banking transactions.',
    redFlags: [
      'Caller insists you install AnyDesk, TeamViewer, QuickSupport, or RustDesk',
      'Caller demands your 9-digit screen sharing session code',
      'Caller asks you to log into your NetBanking app while screen share is active',
    ],
    safeRules: [
      'Banks and payment apps NEVER require screen sharing for customer support.',
      'Never share your remote access code with anyone.',
      'If you accidentally install a remote app, turn on Airplane mode immediately and uninstall it.',
    ],
    realWorldScenario: 'A scammer claiming to be an HDFC credit card manager told an elderly victim they had a ₹2,000 annual fee refund. They guided him to install AnyDesk. While the app was running, the scammer observed his credentials and withdrew ₹1,20,000.',
    quiz: {
      question: 'Will a genuine bank executive ever ask you to install AnyDesk?',
      options: [
        'Yes, for KYC verification',
        'Yes, if there is a card refund issue',
        'NO, legitimate banks never ask customers to install remote access apps',
        'Only on weekends',
      ],
      correctIndex: 2,
      explanation: 'Banks and payment companies have strict security guidelines prohibiting executives from requesting remote screen sharing under any circumstances.',
    },
  },
  {
    id: 'lesson-digital-arrest',
    title: 'Customs & "Digital Arrest" Fear Extortion',
    category: 'Law Enforcement Extortion',
    readTimeMinutes: 3,
    summary: 'Fraudsters impersonating police or customs officers threaten victims with fake arrest warrants over Skype/WhatsApp for allegedly sending illegal parcels.',
    scamMechanism: 'Victims are subjected to intense psychological pressure and kept on continuous video calls ("Digital Arrest") while being forced to transfer life savings to "RBI verification accounts".',
    redFlags: [
      'Claims that illegal contraband or fake passports were seized in a parcel in your name',
      'Video call showing fake police station backdrop or uniform',
      'Demands that you stay on video call for hours and not contact anyone',
      'Demands to transfer money to a "safe government account" for verification',
    ],
    safeRules: [
      'There is NO legal concept of "Digital Arrest" in India or internationally.',
      'Police, CBI, and Customs never conduct inquiries or trials via video calls.',
      'Never transfer money to any account for "verification" or "clearance".',
    ],
    realWorldScenario: 'An IT professional was called by someone claiming to be FedEx, saying 5 passports were found in a package to Taiwan. The call was transferred to "Mumbai Crime Branch" on Skype. Terrified by threats of jail, the victim transferred ₹25 Lakhs before realizing it was a scam.',
    quiz: {
      question: 'What should you do if an unverified caller claims an arrest warrant has been issued against you on Skype?',
      options: [
        'Stay on the Skype call and transfer funds to prove innocence',
        'Hang up immediately and report to Cyber Helpline 1930 and local police',
        'Share your Aadhaar and passport details over video',
        'Keep the incident secret as instructed by the caller',
      ],
      correctIndex: 1,
      explanation: 'Law enforcement agencies never issue arrest warrants or conduct official investigations over video calls. Hang up and dial 1930 immediately.',
    },
  },
];

export function SafetyCenterView() {
  const { t } = useTranslation();
  const [activeLesson, setActiveLesson] = useState<SafetyLesson | null>(null);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleOpenLesson = (lesson: SafetyLesson) => {
    setActiveLesson(lesson);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-cyan-400" />
          <span>{t.nav.safety}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Actionable, multilingual cybersecurity lessons grounded in real-world fraud vectors.
        </p>
      </div>

      {/* Lesson List / Active Lesson View */}
      {!activeLesson ? (
        <div className="space-y-3">
          {SAFETY_LESSONS.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => handleOpenLesson(lesson)}
              className="p-4 rounded-2xl border border-slate-800 bg-[#0F1A30]/80 hover:border-cyan-500/40 hover:bg-[#0F1A30] cursor-pointer transition-all space-y-2 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {lesson.category}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {lesson.readTimeMinutes} min read
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                <span>{lesson.title}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {lesson.summary}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* Detailed Lesson Screen */
        <div className="space-y-4 rounded-2xl border border-cyan-500/30 bg-[#0F1A30] p-4.5 sm:p-5 shadow-xl">
          <button
            onClick={() => setActiveLesson(null)}
            className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            ← Back to Lessons
          </button>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {activeLesson.category}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 pt-1">
              {activeLesson.title}
            </h2>
          </div>

          {/* How the scam works */}
          <div className="space-y-1.5 pt-2">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              How Fraudsters Execute This:
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-slate-800">
              {activeLesson.scamMechanism}
            </p>
          </div>

          {/* Real World Scenario */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Real Incident Case Study:</span>
            </h4>
            <p className="text-xs text-amber-100/90 leading-relaxed bg-amber-950/20 p-3 rounded-xl border border-amber-500/30 italic">
              "{activeLesson.realWorldScenario}"
            </p>
          </div>

          {/* Key Red Flags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Critical Red Flags:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {activeLesson.redFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-400 font-bold shrink-0">⚠️</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Unbreakable Safe Rules */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Unbreakable Safety Rules:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-emerald-100">
              {activeLesson.safeRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Knowledge Quiz */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Quick Knowledge Check:</span>
            </div>

            <p className="text-xs font-semibold text-slate-100">
              {activeLesson.quiz.question}
            </p>

            <div className="space-y-1.5">
              {activeLesson.quiz.options.map((opt, idx) => {
                const isSelected = selectedQuizAnswer === idx;
                const isCorrect = idx === activeLesson.quiz.correctIndex;

                let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300';
                if (quizSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-950/60 border-red-500 text-red-200';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-cyan-950 border-cyan-400 text-cyan-200';
                }

                return (
                  <button
                    key={idx}
                    disabled={quizSubmitted}
                    onClick={() => setSelectedQuizAnswer(idx)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {!quizSubmitted ? (
              <button
                disabled={selectedQuizAnswer === null}
                onClick={() => setQuizSubmitted(true)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
              >
                Submit Answer
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
                <span className="font-bold">Explanation: </span>
                {activeLesson.quiz.explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
