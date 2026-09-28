'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner';
import { BottomNav } from '@/components/common/BottomNav';
import { HomeDashboardView } from '@/components/dashboard/HomeDashboardView';
import { MessageScannerView } from '@/components/scanners/MessageScannerView';
import { LinkGuardView } from '@/components/scanners/LinkGuardView';
import { ScreenshotOcrView } from '@/components/scanners/ScreenshotOcrView';
import { QrShieldView } from '@/components/scanners/QrShieldView';
import { AnalysisResultView } from '@/components/analysis/AnalysisResultView';
import { ImmediateResponseWizard } from '@/components/emergency/ImmediateResponseWizard';
import { EvidenceVaultView } from '@/components/vault/EvidenceVaultView';
import { SafetyCenterView } from '@/components/safety/SafetyCenterView';
import { ThreatMapView } from '@/components/safety/ThreatMapView';
import { FamilyModeView } from '@/components/family/FamilyModeView';
import { SafetyAssistantView } from '@/components/assistant/SafetyAssistantView';
import { ProtectionCenterView } from '@/components/settings/ProtectionCenterView';
import { PrivacyCenterView } from '@/components/settings/PrivacyCenterView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ProfileView } from '@/components/profile/ProfileView';
import { SecurityCenterView } from '@/components/security/SecurityCenterView';
import { AuthModal } from '@/components/auth/AuthModal';
import { OtpVerificationView } from '@/components/auth/OtpVerificationView';
import { DemoScenariosModal } from '@/components/demo/DemoScenariosModal';
import { ReportExportModal } from '@/components/reports/ReportExportModal';
import { VendorDashboardView } from '@/components/dashboard/VendorDashboardView';
import { AnalysisResult, IncidentReport, EvidenceItem } from '@/types/scam';
import { DemoScenario } from '@/lib/demo/demoData';
import { inspectUrlSafely } from '@/lib/scanners/linkGuard';
import { analyzeScamMessage } from '@/lib/scanners/messageScanner';
import { getCurrentUserProfile, DEFAULT_DEMO_USER, logSecurityEvent, signOut } from '@/lib/auth/authService';
import { supabase } from '@/lib/supabase';
import { UserProfile, OtpChallenge, UserRole } from '@/types/auth';
import { ShieldAlert } from 'lucide-react';

type ActiveView =
  | 'home'
  | 'vendor_dashboard'
  | 'message_scanner'
  | 'link_guard'
  | 'screenshot_ocr'
  | 'qr_shield'
  | 'analysis_result'
  | 'emergency'
  | 'vault'
  | 'safety'
  | 'threat_map'
  | 'family_mode'
  | 'assistant'
  | 'protection_center'
  | 'privacy_center'
  | 'settings'
  | 'profile'
  | 'security_center';

export default function FraudLockApp() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [isFamilyMode, setIsFamilyMode] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeOtpChallenge, setActiveOtpChallenge] = useState<OtpChallenge | null>(null);
  const [pendingOtpCredentials, setPendingOtpCredentials] = useState<{
    email?: string;
    phone?: string;
    password?: string;
    displayName?: string;
    apartmentBlock?: string;
    apartmentUnit?: string;
    role?: UserRole;
  } | undefined>(undefined);

  // Active scan analysis state
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [currentRawContent, setCurrentRawContent] = useState<string>('');
  const [currentScanType, setCurrentScanType] = useState<string>('message');

  // Assistant context
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string>('');

  // Modals state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [reportForExport, setReportForExport] = useState<IncidentReport | null>(null);

  // Initialize and load user profile with live Supabase Auth listener
  useEffect(() => {
    loadUser();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await loadUser();
        } else {
          setCurrentUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loadUser = async () => {
    const profile = await getCurrentUserProfile();
    setCurrentUser(profile);
  };

  // PWA Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
      });
    }
  }, []);

  const handleScanResult = (result: AnalysisResult, rawContent: string, scanType: string) => {
    setCurrentResult(result);
    setCurrentRawContent(rawContent);
    setCurrentScanType(scanType);
    setActiveView('analysis_result');
  };

  const handleSelectScannerFromDashboard = (type: 'message' | 'link' | 'screenshot' | 'qr') => {
    if (type === 'message') setActiveView('message_scanner');
    if (type === 'link') setActiveView('link_guard');
    if (type === 'screenshot') setActiveView('screenshot_ocr');
    if (type === 'qr') setActiveView('qr_shield');
  };

  const handleSelectNavTab = (tab: string) => {
    if (tab === 'home') setActiveView('home');
    else if (tab === 'scanners') setActiveView('message_scanner');
    else if (tab === 'emergency') setActiveView('emergency');
    else if (tab === 'vault') setActiveView('vault');
    else if (tab === 'safety') setActiveView('safety');
  };

  const handleLoadDemoScenario = async (scenario: DemoScenario) => {
    if (scenario.type === 'message') {
      const res = await analyzeScamMessage(scenario.inputContent, 'en');
      handleScanResult(res, scenario.inputContent, 'message');
    } else if (scenario.type === 'link') {
      const res = inspectUrlSafely(scenario.inputContent, 'en');
      handleScanResult(res.analysis, scenario.inputContent, 'link');
    } else if (scenario.type === 'qr') {
      setActiveView('qr_shield');
    }
  };

  const handlePrepareReportFromAnalysis = (result: AnalysisResult, rawInput: string) => {
    const report: IncidentReport = {
      id: `INCIDENT_${Date.now()}`,
      user_id: currentUser?.id || 'local-user',
      incident_type: result.category,
      incident_date: new Date().toISOString(),
      financial_loss_amount: 0,
      currency: 'INR',
      scammer_platform: currentScanType.toUpperCase(),
      scammer_contacts: [],
      summary: `User scanned suspicious ${currentScanType}: "${rawInput.slice(0, 150)}..."`,
      timeline_events: [
        {
          timestamp: new Date().toISOString(),
          description: `Fraud Lock advisory flagged high-risk pattern: ${result.category}`,
          verified_by_user: true,
        },
      ],
      emergency_steps_taken: {
        bank_contacted: false,
        card_blocked: false,
        upi_complaint_filed: false,
        cyber_helpline_called: false,
        passwords_changed: false,
        app_uninstalled: false,
      },
      evidence_ids: [],
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setReportForExport(report);
  };

  const handleAskAssistantWithContext = (contextPrompt: string) => {
    setAssistantInitialPrompt(contextPrompt);
    setActiveView('assistant');
  };

  // Auth & OTP Handlers
  const handleOtpRequired = (
    challenge: OtpChallenge,
    tempCredentials?: {
      email?: string;
      phone?: string;
      password?: string;
      displayName?: string;
      apartmentBlock?: string;
      apartmentUnit?: string;
      role?: UserRole;
    }
  ) => {
    setActiveOtpChallenge(challenge);
    setPendingOtpCredentials(tempCredentials);
  };

  const handleOtpSuccess = async (destination: string, purpose: OtpChallenge['purpose']) => {
    const savedCredentials = pendingOtpCredentials;
    setActiveOtpChallenge(null);
    setPendingOtpCredentials(undefined);
    await loadUser();

    // Check user profile role for routing
    const profile = await getCurrentUserProfile();
    const effectiveRole = savedCredentials?.role || profile?.role;

    if (effectiveRole === 'vendor') {
      setActiveView('vendor_dashboard');
    } else {
      setActiveView('home');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setActiveView('home');
  };

  const handleAccountDeleted = () => {
    setCurrentUser(null);
    setActiveView('home');
  };

  // Content Renderer
  const renderCurrentView = () => {
    if (isFamilyMode) {
      return (
        <FamilyModeView
          onExitFamilyMode={() => setIsFamilyMode(false)}
          onOpenMessageScanner={() => setActiveView('message_scanner')}
        />
      );
    }

    // Do not allow users to access protected dashboards until their OTP is successfully verified
    const isProtected = activeView === 'vendor_dashboard' || activeView === 'vault' || activeView === 'security_center';
    if (isProtected && !currentUser) {
      return (
        <div className="max-w-md mx-auto p-6 rounded-3xl border border-cyan-500/30 bg-[#090F1E] text-center space-y-4 shadow-2xl my-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Protected Area Access</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Identity verification required. Please complete OTP authentication to access your protected dashboard.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            Sign In / Register with OTP
          </button>
        </div>
      );
    }

    switch (activeView) {
      case 'home':
        return (
          <HomeDashboardView
            onSelectScanner={handleSelectScannerFromDashboard}
            onOpenEmergency={() => setActiveView('emergency')}
            onOpenFamilyMode={() => setIsFamilyMode(true)}
            onOpenDemoScenarios={() => setIsDemoModalOpen(true)}
            onOpenAssistant={() => setActiveView('assistant')}
            onOpenThreatMap={() => setActiveView('threat_map')}
          />
        );

      case 'vendor_dashboard':
        return (
          <VendorDashboardView
            currentUser={currentUser}
            onSwitchToCustomerView={() => setActiveView('home')}
            onSignOut={handleSignOut}
            onOpenEmergency={() => setActiveView('emergency')}
          />
        );

      case 'message_scanner':
        return <MessageScannerView onResult={handleScanResult} />;

      case 'link_guard':
        return <LinkGuardView onResult={handleScanResult} />;

      case 'screenshot_ocr':
        return <ScreenshotOcrView onResult={handleScanResult} />;

      case 'qr_shield':
        return (
          <QrShieldView
            onResult={handleScanResult}
            onOpenLinkGuard={() => {
              setActiveView('link_guard');
            }}
          />
        );

      case 'analysis_result':
        if (!currentResult) {
          return (
            <HomeDashboardView
              onSelectScanner={handleSelectScannerFromDashboard}
              onOpenEmergency={() => setActiveView('emergency')}
              onOpenFamilyMode={() => setIsFamilyMode(true)}
              onOpenDemoScenarios={() => setIsDemoModalOpen(true)}
              onOpenAssistant={() => setActiveView('assistant')}
              onOpenThreatMap={() => setActiveView('threat_map')}
            />
          );
        }
        return (
          <AnalysisResultView
            result={currentResult}
            rawInput={currentRawContent}
            scanType={currentScanType}
            onScanAnother={() => setActiveView('message_scanner')}
            onPrepareReport={handlePrepareReportFromAnalysis}
            onAskAssistant={handleAskAssistantWithContext}
          />
        );

      case 'emergency':
        return (
          <ImmediateResponseWizard
            onBackToHome={() => setActiveView('home')}
            onOpenReportExport={(rep) => setReportForExport(rep)}
          />
        );

      case 'vault':
        return (
          <EvidenceVaultView
            onOpenReportExport={(rep) => setReportForExport(rep)}
          />
        );

      case 'safety':
        return <SafetyCenterView />;

      case 'threat_map':
        return <ThreatMapView />;

      case 'assistant':
        return <SafetyAssistantView initialPrompt={assistantInitialPrompt} />;

      case 'protection_center':
        return <ProtectionCenterView />;

      case 'privacy_center':
        return <PrivacyCenterView />;

      case 'profile':
        return (
          <ProfileView
            onOpenSecurityCenter={() => setActiveView('security_center')}
            onOpenPrivacyCenter={() => setActiveView('privacy_center')}
            onRequestOtp={handleOtpRequired}
            onAccountDeleted={handleAccountDeleted}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
          />
        );

      case 'security_center':
        return <SecurityCenterView />;

      case 'settings':
        return (
          <SettingsView
            onOpenPrivacyCenter={() => setActiveView('privacy_center')}
            onOpenProtectionCenter={() => setActiveView('protection_center')}
            isFamilyMode={isFamilyMode}
            onToggleFamilyMode={() => setIsFamilyMode(!isFamilyMode)}
          />
        );

      default:
        return (
          <HomeDashboardView
            onSelectScanner={handleSelectScannerFromDashboard}
            onOpenEmergency={() => setActiveView('emergency')}
            onOpenFamilyMode={() => setIsFamilyMode(true)}
            onOpenDemoScenarios={() => setIsDemoModalOpen(true)}
            onOpenAssistant={() => setActiveView('assistant')}
            onOpenThreatMap={() => setActiveView('threat_map')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between">
      {/* Top Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Container: Full screen or Simulated Mobile Canvas Frame */}
      <div
        className={`w-full mx-auto flex flex-col flex-1 transition-all ${
          isMobileFrame
            ? 'max-w-md my-4 border border-cyan-500/30 rounded-[38px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-[#070B14]'
            : 'max-w-4xl'
        }`}
      >
        {/* App Header */}
        <Header
          onOpenEmergency={() => setActiveView('emergency')}
          isFamilyMode={isFamilyMode}
          onToggleFamilyMode={() => setIsFamilyMode(!isFamilyMode)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
          onSelectNav={(nav) => setActiveView(nav as ActiveView)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

        {/* View Switcher Sub-Header for Scanner Tabs */}
        {(activeView === 'message_scanner' ||
          activeView === 'link_guard' ||
          activeView === 'screenshot_ocr' ||
          activeView === 'qr_shield') && (
          <div className="bg-[#090F1E] border-b border-cyan-500/20 px-3 py-2 flex items-center justify-between gap-1 overflow-x-auto text-xs">
            {[
              { id: 'message_scanner', label: 'Message' },
              { id: 'link_guard', label: 'Link Guard' },
              { id: 'screenshot_ocr', label: 'Screenshot' },
              { id: 'qr_shield', label: 'QR Shield' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as ActiveView)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeView === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5">
          {renderCurrentView()}
        </main>

        {/* Bottom Nav */}
        <BottomNav
          activeTab={
            activeView.includes('scanner') || activeView === 'link_guard' || activeView === 'qr_shield'
              ? 'scanners'
              : activeView
          }
          onSelectTab={handleSelectNavTab}
        />
      </div>

      {/* Auth Modal (Login / Sign Up / Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOtpRequired={handleOtpRequired}
        onLoginSuccess={loadUser}
      />

      {/* OTP Verification Modal */}
      {activeOtpChallenge && (
        <OtpVerificationView
          challenge={activeOtpChallenge}
          onSuccess={handleOtpSuccess}
          onCancel={() => {
            setActiveOtpChallenge(null);
            setPendingOtpCredentials(undefined);
          }}
          onChangeMethod={() => {
            setActiveOtpChallenge(null);
            setIsAuthModalOpen(true);
          }}
          onChangeDestination={() => {
            setActiveOtpChallenge(null);
            setIsAuthModalOpen(true);
          }}
          tempCredentials={pendingOtpCredentials}
        />
      )}

      {/* Demo Scenarios Modal */}
      <DemoScenariosModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectScenario={handleLoadDemoScenario}
      />

      {/* Report Export Dossier Modal */}
      {reportForExport && (
        <ReportExportModal
          report={reportForExport}
          isOpen={Boolean(reportForExport)}
          onClose={() => setReportForExport(null)}
        />
      )}
    </div>
  );
}
