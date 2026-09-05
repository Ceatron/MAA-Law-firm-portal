import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Edit3,
  RefreshCw,
  AlertCircle,
  Zap,
  BookOpen,
  ArrowRight,
  ListFilter,
  CheckCircle2,
  FileSearch,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { DraggableModal } from './common/DraggableModal';

// Pre-populated full legal texts for repository documents & transcripts
export const mockLegalTexts: Record<string, string> = {
  'doc-1': `IN THE HIGH COURT OF KENYA AT NAIROBI
COMMERCIAL & TAX DIVISION
COMMERCIAL SUIT NO. E142 OF 2026

BETWEEN:
SAFARICOM PLC ................................................................ 1ST APPLICANT / PLAINTIFF
AND
COMPETITION AUTHORITY OF KENYA (CAK) ................. 1ST RESPONDENT
COMMUNICATIONS AUTHORITY OF KENYA ................. 2ND RESPONDENT

CHAMBER SUMMONS UNDER CERTIFICATE OF URGENCY
(Brought under Order 51 Rules 1 & 3 of the Civil Procedure Rules 2010 and Section 84W of the Kenya Information and Communications Act, Cap 411A)

TAKE NOTICE that this Honorable Court shall be moved on the 22nd day of August 2026 at 9:00 o'clock in the forenoon or so soon thereafter for the hearing of an Application by Counsel for the 1st Applicant WHEREUPON ORDERS ARE SOUGHT:

1. THAT this Application be certified as extremely urgent and ex-parte service be dispensed with in the first instance due to imminent regulatory enforcement action scheduled for 15th August 2026.
2. THAT an Interim Injunction be issued restraining the 1st Respondent (CAK), its directors, officers, agents, or servants from enforcing Directive No. CAK/REG/2026/089 compelling Safaricom PLC to dismantle its proprietary mobile money distribution network or enforce compulsory national roaming tariffs at below-cost pricing pending the inter-partes hearing.
3. THAT an Order of Stay of Execution be issued suspending the financial penalty of KES 1,450,000,000 (Kenya Shillings One Billion Four Hundred and Fifty Million) levied against the Applicant by the 1st Respondent on 3rd August 2026.
4. THAT costs of this Application be provided for.

GROUNDS OF THE APPLICATION:
A. The 1st Respondent acted ultra vires its statutory powers under Section 24 of the Competition Act No. 12 of 2011 by issuing punitive administrative fines without affording the Applicant a fair administrative hearing as guaranteed under Article 47 of the Constitution of Kenya 2010.
B. The mandatory unbundling order threatens critical national telecommunication infrastructure servicing over 32 million Kenyan citizens and daily financial transactions exceeding KES 28 Billion on M-PESA.
C. The Applicant will suffer irreparable loss and severe reputational harm that cannot be adequately compensated by damages if the unconstitutional directive takes effect prior to judicial review.

DATED at NAIROBI this 5th day of August 2026.
MUTHONI & AHAGO ADVOCATES
ADVOCATES FOR THE PLAINTIFF / APPLICANT`,

  'doc-2': `IN THE HIGH COURT OF KENYA AT NAIROBI
COMMERCIAL & TAX DIVISION
COMMERCIAL SUIT NO. E142 OF 2026

REPLYING AFFIDAVIT OF MICHAEL MBURU

I, MICHAEL MBURU, of Post Office Box Number 66827-00800, Nairobi in the Republic of Kenya, do hereby make oath and state as follows:

1. THAT I am a adult male Kenyan citizen of sound mind, currently residing in Nairobi and the Chief Technology Officer (CTO) of Safaricom PLC, the 1st Applicant herein, and I am duly authorized to swear this Replying Affidavit on its behalf.
2. THAT I have read and understood the Replying Affidavit sworn by Dr. Adano Roba on behalf of the Competition Authority of Kenya (CAK) on 8th August 2026, and I wish to categorically rebut the allegations of market distortion and predatory spectrum hoarding contained therein.
3. THAT in response to Paragraphs 12 through 18 of the Respondent's Affidavit, Safaricom PLC has invested over KES 38.5 Billion in expanding 5G network coverage and optical fiber connectivity across 47 counties over the past three fiscal years (Annexed hereto and marked as Exhibit "MM-1" is the certified capital expenditure audit report by PricewaterhouseCoopers).
4. THAT the pricing structure for national network interconnectivity is strictly governed by the Communications Authority Interconnection Regulations, and Safaricom's tariffs are benchmarked directly against international ITU standards to prevent margin squeeze.
5. THAT the allegation that Safaricom enforces exclusive dealer lock-ins is factually false. Since 2021, all retail M-PESA agent outlets operate on open non-exclusive agent agreements in full compliance with CAK Order No. 4 of 2014 (Annexed hereto and marked as Exhibit "MM-2" is a copy of the standard Master Agent Agreement).
6. THAT I swear this Affidavit to set the record straight and humbly urge this Honorable Court to grant the injunctive relief sought in the Chamber Summons dated 5th August 2026.

SWORN at NAIROBI by the said MICHAEL MBURU this 10th day of August 2026.
BEFORE ME: COMMISSIONER FOR OATHS`,

  'transcript-1': `COURT TRANSCRIPT - HIGH COURT MILIMANI COMMERCIAL COURT 4
BEFORE JUSTICE FRANCIS MWANGI
DATE: 10TH AUGUST 2026
CASE: SAFARICOM PLC v. COMPETITION AUTHORITY OF KENYA (SUIT NO. E142/2026)
SESSION: DAY 3 CROSS-EXAMINATION OF EXPERT WITNESS DR. JAMES OMONDI

THE COURT: Counsel Ochieng, you may proceed with the cross-examination of Dr. Omondi.
ADV. DAVID OCHIENG: Much obliged, My Lord. Dr. Omondi, you state in Paragraph 14 of your expert report that Safaricom holds a 'dominant market position' exceeding 65% in retail mobile money, correct?
DR. JAMES OMONDI (EXPERT WITNESS): That is correct, Counsel. Our econometric modeling indicates market share of 68.4% based on active subscriber volume.
ADV. DAVID OCHIENG: Right. But Dr. Omondi, in calculating that percentage, did your team factor in interoperable bank-to-wallet transfers from Equity Bank's Equitel, KCB VOOMA, and Airtel Money?
DR. OMONDI: Er... we considered them secondary platforms, Counsel.
ADV. DAVID OCHIENG: Secondary? Is it not true that under Central Bank of Kenya 2025 Interoperability Regulations, over KES 14 Billion flows seamlessly across all wallets daily without any lock-in fee?
DR. OMONDI: Yes, the technical interoperability exists, but user preference remains heavily skewed toward Safaricom's brand ecosystem.
ADV. DAVID OCHIENG: So your finding of 'market distortion' is based on consumer brand choice rather than technical or price barriers created by my client?
DR. OMONDI: It is a combination of network effect and historical market presence.
ADV. DAVID OCHIENG: My Lord, I refer the witness to Exhibit MM-3, page 42 of the bundle. Dr. Omondi, please read line 12 aloud.
DR. OMONDI: 'Tariff rates charged by Safaricom for inter-bank transfers decreased by 18.5% between 2024 and 2026.'
ADV. DAVID OCHIENG: Decreased by 18.5%, My Lord. No further questions for this witness.
THE COURT: Re-examination, Counsel Kilonzo?
ADV. KILONZO: No re-examination, My Lord.
THE COURT: Very well. Matter adjourned to 18th August 2026 for final oral submissions.`,

  'doc-4': `LEGAL OPINION & TAX RISK ASSESSMENT
TO: THE AUDIT & RISK COMMITTEE, EQUITY BANK KENYA LIMITED
FROM: MUTHONI & AHAGO ADVOCATES
DATE: 4TH AUGUST 2026
SUBJECT: CONSTITUTIONALITY OF EXCISE DUTY STATUTORY AMENDMENTS UNDER FINANCE ACT 2026 & RECOVERABILITY OF TAX REMITTANCES

1. EXECUTIVE SUMMARY & INSTRUCTING CLIENT REQUEST
We have been instructed by the Board of Directors of Equity Bank Kenya Limited to render a comprehensive legal opinion on the enforceability of Section 34 of the Finance Act 2026, which imposes a retrospective 15% excise duty on cross-border wire remittances and mobile wallet transaction fees processed between January 2025 and June 2026.

2. STATUTORY FRAMEWORK & CONSTITUTIONAL CONFLICT
- Section 34 of the Finance Act 2026 seeks to collect retroactive taxes on financial services previously designated as tax-exempt under the Excise Duty Act (Cap 472).
- Article 210(1) of the Constitution of Kenya 2010 provides that 'No tax or licensing fee may be imposed, waived or varied except as provided by legislation.'
- The principle against retroactive tax burden was affirmed by the Court of Appeal in Kenya Revenue Authority v. Republic ex-parte Piatto Limited [2024] eKLR, holding that retroactive taxation violates legitimate expectation under Article 47.

3. LEGAL RISK EXPOSURE & FINANCIAL QUANTUM
Should the Kenya Revenue Authority (KRA) issue a demand notice, Equity Bank faces an estimated retrospective liability of KES 850,000,000 plus statutory penalties of 20% per annum under Section 83 of the Tax Procedures Act 2015.

4. RECOMMENDED STRATEGIC LITIGATION STEPS
A. File a High Court Constitutional Petition under Article 22 seeking a declaration that Section 34 of the Finance Act 2026 is unconstitutional, null and void.
B. Obtain an urgent conservatory order staying any KRA enforcement, agency notices, or bank account freezes under Section 42 of the Tax Procedures Act.
C. Establish an escrow reserve fund pending the outcome of the Tax Appeals Tribunal consolidated proceedings.

OPINION RENDERED BY: ADV. PAUL AHAGO, SENIOR PARTNER`
};

interface AISummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: DocumentItem | null;
  initialText?: string;
  initialTitle?: string;
  onApplySummaryToDraft?: (summaryText: string) => void;
}

export const AISummarizeModal: React.FC<AISummarizeModalProps> = ({
  isOpen,
  onClose,
  document,
  initialText = '',
  initialTitle = '',
  onApplySummaryToDraft,
}) => {
  if (!isOpen) return null;

  const docTitle = document?.title || initialTitle || 'Court_Pleading_Case_File.pdf';
  const defaultText =
    (document && mockLegalTexts[document.id]) ||
    initialText ||
    mockLegalTexts['doc-1'];

  const [documentTitle, setDocumentTitle] = useState(docTitle);
  const [sourceText, setSourceText] = useState(defaultText);
  const [focusArea, setFocusArea] = useState('Full Comprehensive Legal Analysis');
  const [summaryResult, setSummaryResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync state if props change
  useEffect(() => {
    if (document) {
      setDocumentTitle(document.title);
      setSourceText(mockLegalTexts[document.id] || initialText || mockLegalTexts['doc-1']);
    } else if (initialTitle || initialText) {
      if (initialTitle) setDocumentTitle(initialTitle);
      if (initialText) setSourceText(initialText);
    }
  }, [document, initialTitle, initialText]);

  // Handler for Gemini API Call
  const handleGenerateSummary = async () => {
    if (!sourceText.trim()) {
      setErrorMsg('Please enter or select document text to summarize.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSummaryResult('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          documentTitle,
          focusArea,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      setSummaryResult(data.summary || 'Summary completed without text output.');
    } catch (err: any) {
      console.error('API Summarization error:', err);
      setErrorMsg(
        err?.message || 'Failed to generate summary. Please ensure server is running and GEMINI_API_KEY is configured.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInsertIntoDrafter = () => {
    if (onApplySummaryToDraft && summaryResult) {
      onApplySummaryToDraft(summaryResult);
      onClose();
    }
  };

  // Quick preset loader
  const handleLoadPreset = (key: string, name: string) => {
    setDocumentTitle(name);
    setSourceText(mockLegalTexts[key] || '');
    setSummaryResult('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <DraggableModal
        gripLabel="LEGAL DOCUMENT AI ANALYSIS"
        className="relative w-full max-w-4xl rounded-xl border border-[#dedbc5] bg-[#fbf9f4] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div
          data-drag-handle="true"
          className="flex items-center justify-between border-b border-[#e2dfd5] bg-[#16181b] px-6 py-4 text-white shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#0B63E5] shadow-xs">
              <FileSearch className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-base font-bold text-stone-100">
                  Legal Document Analysis & Case Brief
                </h2>
                <span className="rounded bg-[#0B63E5]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300 border border-[#0B63E5]/40">
                  Kenyan Jurisprudence
                </span>
              </div>
              <p className="text-[11px] text-[#60A5FA]">
                Muthoni Ahago Advocates • Structured Executive Case Summaries & Precedents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Preset Selector Bar */}
          <div className="rounded-lg border border-[#dedbc5] bg-white p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
              <span className="flex items-center space-x-1.5">
                <BookOpen className="h-4 w-4 text-[#0B63E5]" />
                <span>Select Legal Document / Court File Preset:</span>
              </span>
              <span className="text-[10px] text-stone-400">Or paste custom text below</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleLoadPreset(
                    'doc-1',
                    'Chamber_Summons_Safaricom_v_CAK_Cert_of_Urgency.pdf'
                  )
                }
                className="rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-800 transition-colors cursor-pointer"
              >
                📄 Notice of Motion (Safaricom v CAK)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoadPreset(
                    'doc-2',
                    'Replying_Affidavit_Michael_Mburu_Signed.pdf'
                  )
                }
                className="rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-800 transition-colors cursor-pointer"
              >
                📄 Replying Affidavit (CTO Sworn Statement)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoadPreset(
                    'transcript-1',
                    'Court_Hearing_Transcript_Day3_Cross_Exam.txt'
                  )
                }
                className="rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-800 transition-colors cursor-pointer"
              >
                🎙️ Court Hearing Transcript (Day 3 Cross-Exam)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoadPreset(
                    'doc-4',
                    'Legal_Opinion_KRA_Remittance_Excise_Taxation.pdf'
                  )
                }
                className="rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-800 transition-colors cursor-pointer"
              >
                📜 Tax Legal Opinion (Finance Act 2026)
              </button>
            </div>
          </div>

          {/* Form Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Document / Case Title
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g. Plaint / Court Transcript No. E142 of 2026"
                className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Analysis Angle / Focus Area
              </label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full rounded-md border border-[#dcd8c9] bg-white px-3 py-2 text-stone-900 focus:border-[#0B63E5] focus:outline-none cursor-pointer"
              >
                <option value="Full Comprehensive Legal Analysis">Full Comprehensive Legal Analysis</option>
                <option value="Key Liabilities & Financial Exposure">Key Liabilities & Financial Exposure</option>
                <option value="Procedural Deadlines & Remedies Sought">Procedural Deadlines & Remedies Sought</option>
                <option value="Witness Testimony & Cross-Exam Highlights">Witness Testimony & Cross-Exam Highlights</option>
                <option value="Statutory & Constitutional Arguments">Statutory & Constitutional Arguments</option>
              </select>
            </div>
          </div>

          {/* Source Legal Text Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-800 flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5 text-[#0B63E5]" />
                <span>Source Text / Transcript Content</span>
              </label>
              <span className="text-[10px] text-stone-400 font-mono">
                {sourceText.length.toLocaleString()} characters
              </span>
            </div>
            <textarea
              rows={6}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste full text of court pleadings, affidavits, hearing transcripts, or legal contracts here..."
              className="w-full rounded-md border border-[#dcd8c9] bg-white p-3 font-mono text-[11px] text-stone-900 placeholder-stone-400 focus:border-[#0B63E5] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between bg-stone-100 p-3 rounded-lg border border-stone-200">
            <div className="flex items-center space-x-2 text-[11px] text-stone-600">
              <CheckCircle2 className="h-4 w-4 text-[#0B63E5]" />
              <span>Synthesizes key legal claims, prayers sought, statutory references, and precedents</span>
            </div>

            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isLoading || !sourceText.trim()}
              className={`flex items-center space-x-2 rounded-md px-5 py-2 font-bold text-white shadow-sm transition-all cursor-pointer ${
                isLoading || !sourceText.trim()
                  ? 'bg-stone-400 cursor-not-allowed'
                  : 'bg-[#0B63E5] hover:bg-[#0256D0]'
              }`}
            >
              <FileSearch className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Synthesizing Brief...' : 'Generate Case Brief'}</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3.5 text-red-900 text-xs flex items-start space-x-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Summarization Error</p>
                <p className="mt-0.5 text-[11px] opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-8 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-[#0B63E5] animate-spin mx-auto" />
              <div>
                <h4 className="font-bold text-stone-900 text-sm">
                  Gemini API is analyzing legal document...
                </h4>
                <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                  Extracting key legal issues, material facts, statutory provisions, and strategic action points for Firm Workspace review.
                </p>
              </div>
            </div>
          )}

          {/* Summary Result Box */}
          {summaryResult && !isLoading && (
            <div className="rounded-xl border border-emerald-300 bg-white shadow-xs overflow-hidden space-y-0">
              {/* Result Header */}
              <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50/80 px-4 py-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span className="font-bold text-emerald-950 text-xs">
                    Concise AI Bullet-Point Legal Summary
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center space-x-1 rounded bg-white border border-emerald-300 px-2.5 py-1 text-[11px] font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                  </button>

                  {onApplySummaryToDraft && (
                    <button
                      type="button"
                      onClick={handleInsertIntoDrafter}
                      className="flex items-center space-x-1 rounded bg-[#0B63E5] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#0256D0] transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Insert into Word Drafter</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Formatted Markdown Display */}
              <div className="p-5 font-sans text-stone-800 text-xs leading-relaxed space-y-3 whitespace-pre-wrap selection:bg-blue-100">
                {summaryResult}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#e2dfd5] bg-stone-100 px-6 py-3 shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-stone-500">
            <Sparkles className="h-3.5 w-3.5 text-[#0B63E5]" />
            <span>Muthoni Ahago Advocates Firm Workspace • Powered by Gemini 3.6 Flash</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stone-300 bg-white px-4 py-1.5 font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </DraggableModal>
    </div>
  );
};
