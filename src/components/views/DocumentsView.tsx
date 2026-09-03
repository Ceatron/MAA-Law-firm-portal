import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  Upload,
  Filter,
  History,
  RotateCcw,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  GitCompare,
  X,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileSearch,
  Layers,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderPlus,
  ChevronRight,
  FileCode,
  Printer,
  Copy,
  Edit3,
  UserPlus,
  CheckSquare,
  Building2,
  Lock,
  Share2,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileSignature,
  Send,
  ExternalLink,
} from 'lucide-react';
import { DocumentItem, DocumentVersion, DocumentFolder, DocumentDraft, ClientOnboardingSubmission } from '../../types';
import { AISummarizeModal } from '../AISummarizeModal';
import { loadVisibleStaffRoster } from '../../utils/staffStorage';
import {
  loadSavedDocumentItems,
  saveStoredDocumentItems,
  loadSavedDocumentFolders,
  saveStoredDocumentFolders,
  loadSavedDocumentDrafts,
  saveStoredDocumentDrafts,
  loadSavedOnboardings,
  saveStoredOnboardings,
} from '../../utils/chambersDataStorage';

export const DocumentsView: React.FC = () => {
  const staffList = loadVisibleStaffRoster();
  // Navigation Sub-Tabs: 'repository' (Folders & Docs), 'drafter' (Word Drafter & PDF), 'onboarding' (Online Intake Form)
  const [activeMainTab, setActiveMainTab] = useState<'repository' | 'drafter' | 'onboarding'>('repository');

  // State loaded from persistent storage
  const [documents, setDocuments] = useState<DocumentItem[]>(() => loadSavedDocumentItems());
  const [folders, setFolders] = useState<DocumentFolder[]>(() => loadSavedDocumentFolders());
  const [drafts, setDrafts] = useState<DocumentDraft[]>(() => loadSavedDocumentDrafts());
  const [onboardings, setOnboardings] = useState<ClientOnboardingSubmission[]>(() => loadSavedOnboardings());

  // Automatically sync to storage
  useEffect(() => {
    saveStoredDocumentItems(documents);
  }, [documents]);

  useEffect(() => {
    saveStoredDocumentFolders(folders);
  }, [folders]);

  useEffect(() => {
    saveStoredDocumentDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    saveStoredOnboardings(onboardings);
  }, [onboardings]);

  // AI Summarizer State
  const [isAiSummarizeModalOpen, setIsAiSummarizeModalOpen] = useState(false);
  const [summarizeSelectedDoc, setSummarizeSelectedDoc] = useState<DocumentItem | null>(null);
  const [summarizeInitialText, setSummarizeInitialText] = useState('');
  const [summarizeInitialTitle, setSummarizeInitialTitle] = useState('');

  // Folder Navigation State (null = Root level)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Repository Filters & View Mode
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Modals & Panels State
  const [historyDoc, setHistoryDoc] = useState<DocumentItem | null>(null);
  const [uploadVersionDoc, setUploadVersionDoc] = useState<DocumentItem | null>(null);
  const [compareDoc, setCompareDoc] = useState<DocumentItem | null>(null);
  const [compareVersion1, setCompareVersion1] = useState<DocumentVersion | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<DocumentVersion | null>(null);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);

  // Expanded cards in Timeline mode
  const [expandedDocIds, setExpandedDocIds] = useState<string[]>(['doc-1', 'doc-2']);

  // New Folder Form State
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderMatterRef, setNewFolderMatterRef] = useState('MAA/HC/COM/2026/0142');

  // New Version Form State
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [newVersionCts, setNewVersionCts] = useState('');
  const [newVersionUploader, setNewVersionUploader] = useState(staffList[0]?.name || 'Advocate');

  // New Document Form State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocMatterRef, setNewDocMatterRef] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<DocumentItem['category']>('Pleading');
  const [newDocCts, setNewDocCts] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');

  // WORD DRAFTER STATE
  const defaultBlankDraft: DocumentDraft = {
    id: 'draft-1',
    title: 'Untitled Legal Document Draft',
    category: 'Pleading',
    matterRef: 'FIRM-GENERAL',
    author: staffList[0]?.name || 'Advocate',
    lastModified: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    content: '',
    status: 'Draft',
  };

  const [activeDraft, setActiveDraft] = useState<DocumentDraft>(defaultBlankDraft);
  const [draftTitle, setDraftTitle] = useState(defaultBlankDraft.title);
  const [draftCategory, setDraftCategory] = useState<DocumentDraft['category']>(defaultBlankDraft.category);
  const [draftMatterRef, setDraftMatterRef] = useState(defaultBlankDraft.matterRef);
  const [draftContent, setDraftContent] = useState('');

  // ONLINE ONBOARDING FORM STATE
  const [isOnboardingFormModalOpen, setIsOnboardingFormModalOpen] = useState(false);
  const [onbClientName, setOnbClientName] = useState('');
  const [onbClientType, setOnbClientType] = useState<'Individual' | 'Corporate / SME' | 'Government / State Agency'>('Individual');
  const [onbIdNo, setOnbIdNo] = useState('');
  const [onbEmail, setOnbEmail] = useState('');
  const [onbPhone, setOnbPhone] = useState('');
  const [onbAddress, setOnbAddress] = useState('');
  const [onbMatterType, setOnbMatterType] = useState('');
  const [onbAssignedAdv, setOnbAssignedAdv] = useState(staffList[0]?.name || 'Advocate');
  const [onbRetainer, setOnbRetainer] = useState(0);
  const [onbNotes, setOnbNotes] = useState('');
  const [onbSignature, setOnbSignature] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleExpandDoc = (id: string) => {
    if (expandedDocIds.includes(id)) {
      setExpandedDocIds(expandedDocIds.filter((item) => item !== id));
    } else {
      setExpandedDocIds([...expandedDocIds, id]);
    }
  };

  // FOLDER BREADCRUMB BUILDER
  const getBreadcrumbs = () => {
    const crumbs: DocumentFolder[] = [];
    let curr = folders.find((f) => f.id === currentFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find((f) => f.id === curr?.parentId);
    }
    return crumbs;
  };

  // CREATE NEW FOLDER / SUBFOLDER
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    const newFolder: DocumentFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      parentId: currentFolderId,
      matterRef: newFolderMatterRef,
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      itemCount: 0,
    };

    setFolders([...folders, newFolder]);
    setIsNewFolderModalOpen(false);
    setNewFolderName('');
    showToast(`Folder "${newFolderName}" created successfully.`);
  };

  // RESTORE HISTORIC VERSION HANDLER
  const handleRestoreVersion = (docId: string, versionToRestore: DocumentVersion) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== docId) return doc;

        const currentVers = doc.versions || [];
        const prevMajor = parseFloat(doc.currentVersion?.replace('v', '') || '1.0');
        const restoredVerNum = `v${(prevMajor + 0.1).toFixed(1)} (Restored from ${versionToRestore.versionNumber})`;

        const newlyRestoredVersionRecord: DocumentVersion = {
          id: `ver-${Date.now()}`,
          versionNumber: restoredVerNum,
          title: versionToRestore.title,
          uploadedBy: 'Adv. Costa Kimathi (Restored)',
          uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileSize: versionToRestore.fileSize,
          ctsReceiptNo: versionToRestore.ctsReceiptNo || doc.ctsReceiptNo,
          changeSummary: `Restored legal filing to historic version ${versionToRestore.versionNumber} ("${versionToRestore.changeSummary}")`,
          isCurrent: true,
          diffNotes: [
            `Reverted document structure and clauses back to ${versionToRestore.versionNumber}`,
            `Original version uploaded by ${versionToRestore.uploadedBy} on ${versionToRestore.uploadedDate}`,
          ],
        };

        const updatedVersions = currentVers.map((v) => ({ ...v, isCurrent: false }));
        updatedVersions.unshift(newlyRestoredVersionRecord);

        const updatedDoc = {
          ...doc,
          title: versionToRestore.title,
          fileSize: versionToRestore.fileSize,
          uploadedBy: 'Adv. Costa Kimathi (Restored)',
          uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          ctsReceiptNo: versionToRestore.ctsReceiptNo || doc.ctsReceiptNo,
          currentVersion: restoredVerNum,
          versions: updatedVersions,
        };

        if (historyDoc && historyDoc.id === docId) {
          setHistoryDoc(updatedDoc);
        }

        return updatedDoc;
      })
    );

    showToast(`Successfully restored document to ${versionToRestore.versionNumber}. Active filing updated.`);
  };

  // UPLOAD NEW VERSION HANDLER
  const handleUploadNewVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadVersionDoc) return;

    const currentVers = uploadVersionDoc.versions || [];
    const prevMajor = parseFloat(uploadVersionDoc.currentVersion?.replace('v', '') || '1.0');
    const nextVerNum = `v${(prevMajor + 1.0).toFixed(1)}`;

    const newVerRecord: DocumentVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: nextVerNum,
      title: newVersionTitle || uploadVersionDoc.title,
      uploadedBy: newVersionUploader,
      uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileSize: '3.2 MB',
      ctsReceiptNo: newVersionCts || uploadVersionDoc.ctsReceiptNo,
      changeSummary: newVersionNotes || `Uploaded new revision ${nextVerNum}`,
      isCurrent: true,
      diffNotes: [
        `Updated document contents under ${nextVerNum}`,
        `Submitted by ${newVersionUploader}`,
      ],
    };

    const updatedVersions = currentVers.map((v) => ({ ...v, isCurrent: false }));
    updatedVersions.unshift(newVerRecord);

    setDocuments((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === uploadVersionDoc.id
          ? {
              ...doc,
              title: newVerRecord.title,
              uploadedBy: newVersionUploader,
              uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              ctsReceiptNo: newVerRecord.ctsReceiptNo,
              currentVersion: nextVerNum,
              versions: updatedVersions,
            }
          : doc
      )
    );

    setUploadVersionDoc(null);
    setNewVersionTitle('');
    setNewVersionNotes('');
    setNewVersionCts('');
    showToast(`New version ${nextVerNum} uploaded successfully for "${uploadVersionDoc.title}".`);
  };

  // UPLOAD BRAND NEW DOCUMENT HANDLER
  const handleCreateNewDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;

    const initialVer: DocumentVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: 'v1.0',
      title: newDocTitle.endsWith('.pdf') ? newDocTitle : `${newDocTitle}.pdf`,
      uploadedBy: 'Adv. Costa Kimathi',
      uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileSize: '2.5 MB',
      ctsReceiptNo: newDocCts || undefined,
      changeSummary: newDocNotes || 'Initial pleading upload to e-filing repository',
      isCurrent: true,
      diffNotes: ['First version creation in Legal Document Repository'],
    };

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: initialVer.title,
      matterRef: newDocMatterRef,
      category: newDocCategory,
      fileSize: '2.5 MB',
      uploadedBy: 'Adv. Costa Kimathi',
      uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ctsReceiptNo: newDocCts || undefined,
      currentVersion: 'v1.0',
      versions: [initialVer],
      folderId: currentFolderId,
    };

    setDocuments([newDoc, ...documents]);
    setIsNewDocModalOpen(false);
    setNewDocTitle('');
    setNewDocCts('');
    setNewDocNotes('');
    showToast(`New document "${newDoc.title}" uploaded to repository.`);
  };

  // SAVE WORD DRAFT OR PUBLISH TO REPOSITORY
  const handleSaveDraft = (publishAsDoc: boolean = false) => {
    const updatedDraft: DocumentDraft = {
      ...activeDraft,
      title: draftTitle,
      category: draftCategory,
      matterRef: draftMatterRef,
      content: draftContent,
      lastModified: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDrafts(drafts.map((d) => (d.id === activeDraft.id ? updatedDraft : d)));

    if (publishAsDoc) {
      const docTitle = draftTitle.endsWith('.pdf') ? draftTitle : `${draftTitle}.pdf`;
      const initialVer: DocumentVersion = {
        id: `ver-${Date.now()}`,
        versionNumber: 'v1.0',
        title: docTitle,
        uploadedBy: 'Adv. Costa Kimathi',
        uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        fileSize: '1.2 MB',
        changeSummary: 'Published directly from Law Firm Word Drafter module',
        isCurrent: true,
        diffNotes: ['Draft converted to official court filing document v1.0'],
      };

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: docTitle,
        matterRef: draftMatterRef,
        category: draftCategory as any,
        fileSize: '1.2 MB',
        uploadedBy: 'Adv. Costa Kimathi',
        uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        currentVersion: 'v1.0',
        versions: [initialVer],
        folderId: currentFolderId,
      };

      setDocuments([newDoc, ...documents]);
      showToast(`Draft "${draftTitle}" successfully published into Document Repository as v1.0.`);
    } else {
      showToast(`Draft "${draftTitle}" saved successfully.`);
    }
  };

  // EXPORT / SAVE PDF PRINT FUNCTION
  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${draftTitle} - Legal Document Export</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              margin: 40px;
              color: #111;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0B63E5;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .firm-name {
              font-size: 22px;
              font-weight: bold;
              text-transform: ;
              letter-spacing: 1px;
            }
            .firm-sub {
              font-size: 11px;
              color: #555;
            }
            .content {
              white-space: pre-wrap;
              font-size: 13px;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #ccc;
              padding-top: 12px;
              font-size: 10px;
              color: #666;
              text-align: justify;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="firm-name">MUTHONI & AHAGO ADVOCATES</div>
            <div class="firm-sub">Advocates, Commissioners for Oaths & Notaries Public • Nairobi, Kenya</div>
            <div style="font-size:11px; font-weight:bold; margin-top:6px; color:#0B63E5;">MATTER REF: ${draftMatterRef}</div>
          </div>
          <div class="content">${draftContent}</div>
          <div class="footer">
            CONFIDENTIAL LEGAL WORK PRODUCT • Generated via Muthoni & Ahago Chambers Legal Management Engine.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
    showToast('Opening print / PDF export dialog...');
  };

  // CLIENT ONBOARDING SUBMIT
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onbClientName) return;

    const newSubmission: ClientOnboardingSubmission = {
      id: `onb-${Date.now()}`,
      clientName: onbClientName,
      clientType: onbClientType,
      idOrRegNo: onbIdNo || 'Pending Verification',
      email: onbEmail,
      phone: onbPhone,
      address: onbAddress,
      matterType: onbMatterType,
      assignedAdvocate: onbAssignedAdv,
      retainerFeeKES: Number(onbRetainer) || 150000,
      status: 'Pending Review',
      submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes: onbNotes || 'Submitted via Online Client Portal intake form',
    };

    setOnboardings([newSubmission, ...onboardings]);
    setIsOnboardingFormModalOpen(false);
    setOnbClientName('');
    setOnbEmail('');
    setOnbPhone('');
    setOnbMatterType('');
    setOnbNotes('');
    showToast(`Client onboarding request submitted for ${onbClientName}. Added to pending intake queue.`);
  };

  // APPROVE ONBOARDING & AUTO-CREATE FOLDER
  const handleApproveOnboarding = (submission: ClientOnboardingSubmission) => {
    // 1. Update onboarding status
    setOnboardings(
      onboardings.map((o) =>
        o.id === submission.id ? { ...o, status: 'Onboarded & Matter Opened' } : o
      )
    );

    // 2. Auto-create dedicated Client Folder in Documents
    const matterFolder: DocumentFolder = {
      id: `folder-onb-${Date.now()}`,
      name: `${submission.clientName} - Client Vault`,
      parentId: 'folder-3', // Client Onboarding Vault
      matterRef: `MAA/INTAKE/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      itemCount: 2,
    };

    setFolders([...folders, matterFolder]);

    // 3. Add initial Onboarding KYC Agreement document
    const kycDoc: DocumentItem = {
      id: `doc-onb-${Date.now()}`,
      title: `Client_Retainer_Agreement_${submission.clientName.replace(/\s+/g, '_')}.pdf`,
      matterRef: matterFolder.matterRef || 'MAA/INTAKE/2026',
      category: 'Contract',
      fileSize: '1.5 MB',
      uploadedBy: submission.assignedAdvocate,
      uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      currentVersion: 'v1.0',
      folderId: matterFolder.id,
      versions: [
        {
          id: `ver-onb-${Date.now()}`,
          versionNumber: 'v1.0',
          title: `Client_Retainer_Agreement_${submission.clientName.replace(/\s+/g, '_')}.pdf`,
          uploadedBy: submission.assignedAdvocate,
          uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          fileSize: '1.5 MB',
          changeSummary: 'Digital Retainer & KYC Intake Agreement generated upon client onboarding approval',
          isCurrent: true,
        },
      ],
    };

    setDocuments([kycDoc, ...documents]);
    showToast(`Approved ${submission.clientName}! Auto-created Client Document Vault Folder and Retainer Agreement.`);
  };

  // OPEN COMPARE VERSIONS MODAL
  const handleOpenCompare = (doc: DocumentItem) => {
    setCompareDoc(doc);
    const vers = doc.versions || [];
    setCompareVersion1(vers[0] || null);
    setCompareVersion2(vers[1] || vers[0] || null);
  };

  // Filtered Folders for Current Level
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);

  // Filtered Documents
  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.matterRef.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      (d.ctsReceiptNo && d.ctsReceiptNo.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;

    // In folder mode, show items in current folder if not searching
    const matchesFolder = search ? true : (d.folderId || null) === currentFolderId;

    return matchesSearch && matchesCategory && matchesFolder;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2dfd5] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-[#0B63E5]" />
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              Legal Documents, Word Drafter & Client Onboarding
            </h1>
          </div>
          <p className="mt-1 text-xs text-stone-600">
            Folders & sub-folders, court document versioning, legal pleading drafter with PDF export, and online client onboarding portal.
          </p>
        </div>

        {/* Top Primary Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setSummarizeSelectedDoc(null);
              setSummarizeInitialText('');
              setSummarizeInitialTitle('');
              setIsAiSummarizeModalOpen(true);
            }}
            className="flex items-center space-x-1.5 rounded-md bg-[#0B63E5] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0256D0] transition-all cursor-pointer"
          >
            <FileSearch className="h-4 w-4 text-white" />
            <span>Case Brief Generator</span>
          </button>

          <button
            onClick={() => setIsOnboardingFormModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-md bg-[#1a1d20] px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-[#93C5FD]" />
            <span>Online Client Intake Form</span>
          </button>

          <button
            onClick={() => setActiveMainTab('drafter')}
            className="flex items-center space-x-1.5 rounded-md bg-stone-100 border border-stone-300 px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <Edit3 className="h-4 w-4 text-[#0B63E5]" />
            <span>Draft Word Doc</span>
          </button>

          <button
            onClick={() => setIsNewDocModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-md bg-[#0B63E5] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#0256D0] transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="flex border-b border-[#e2dfd5] bg-white rounded-t-lg px-4 pt-2">
        <button
          onClick={() => setActiveMainTab('repository')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
            activeMainTab === 'repository'
              ? 'border-[#0B63E5] text-[#0B63E5]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Folder className="h-4 w-4" />
          <span>Document & Folder Repository ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('drafter')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
            activeMainTab === 'drafter'
              ? 'border-[#0B63E5] text-[#0B63E5]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span>Legal Word Drafter & PDF Export</span>
        </button>

        <button
          onClick={() => setActiveMainTab('onboarding')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
            activeMainTab === 'onboarding'
              ? 'border-[#0B63E5] text-[#0B63E5]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Online Client Onboarding Portal ({onboardings.length})</span>
        </button>
      </div>

      {/* SECTION 1: FOLDERS & DOCUMENT REPOSITORY */}
      {activeMainTab === 'repository' && (
        <div className="space-y-5">
          {/* Folder Breadcrumb Navigation & Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#e2dfd5] shadow-2xs">
            {/* Breadcrumb Path */}
            <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-700 flex-wrap">
              <button
                onClick={() => setCurrentFolderId(null)}
                className={`flex items-center space-x-1 hover:text-[#0B63E5] cursor-pointer ${
                  currentFolderId === null ? 'text-[#0B63E5] font-black' : 'text-stone-500'
                }`}
              >
                <Folder className="h-4 w-4" />
                <span>Root Vault</span>
              </button>

              {getBreadcrumbs().map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`hover:text-[#0B63E5] cursor-pointer ${
                      currentFolderId === crumb.id ? 'text-[#0B63E5] font-black' : 'text-stone-600'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Folder Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsNewFolderModalOpen(true)}
                className="flex items-center space-x-1.5 rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-800 transition-colors cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 text-[#0B63E5]" />
                <span>{currentFolderId ? 'New Sub-folder' : 'New Folder'}</span>
              </button>

              <div className="inline-flex rounded-md border border-stone-300 bg-stone-100 p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center space-x-1 rounded px-2.5 py-1 transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-[#0B63E5] shadow-2xs font-bold' : 'text-stone-600'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center space-x-1 rounded px-2.5 py-1 transition-colors cursor-pointer ${
                    viewMode === 'timeline' ? 'bg-white text-[#0B63E5] shadow-2xs font-bold' : 'text-stone-600'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Version Timeline</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#e2dfd5] shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search file name, matter ref, CTS receipt or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-stone-300 bg-stone-50 pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 text-xs">
              {['All', 'Pleading', 'Affidavit', 'Contract', 'Title Deed', 'Legal Opinion'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded px-3 py-1.5 font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat ? 'bg-[#1a1d20] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FOLDERS DISPLAY SECTION */}
          {currentFolders.length > 0 && !search && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-500 tracking-wider flex items-center space-x-1.5">
                <Folder className="h-3.5 w-3.5 text-[#0B63E5]" />
                <span>Directories & Folders ({currentFolders.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentFolders.map((folder) => {
                  const subCount = folders.filter((f) => f.parentId === folder.id).length;
                  const docCount = documents.filter((d) => d.folderId === folder.id).length;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="rounded-lg border border-[#e2dfd5] bg-white p-4 shadow-2xs hover:border-[#0B63E5] hover:shadow-md transition-all cursor-pointer flex items-start justify-between group"
                    >
                      <div className="flex items-start space-x-3">
                        <Folder className="h-8 w-8 text-[#0B63E5] fill-[#0B63E5]/10 group-hover:scale-105 transition-transform flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-stone-900 text-xs group-hover:text-[#0B63E5] transition-colors leading-snug">
                            {folder.name}
                          </h4>
                          {folder.matterRef && (
                            <p className="text-[10px] font-mono text-[#0B63E5] font-semibold mt-0.5">
                              {folder.matterRef}
                            </p>
                          )}
                          <p className="text-[10px] text-stone-400 mt-1">
                            {docCount} file(s) • {subCount} subfolder(s)
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-stone-900" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DOCUMENTS DISPLAY SECTION */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-500 tracking-wider flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5 text-[#0B63E5]" />
              <span>Court Files & Legal Documents ({filtered.length})</span>
            </h3>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((doc) => {
                  const versionsCount = doc.versions?.length || 1;
                  const activeVer = doc.currentVersion || 'v1.0';

                  return (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-[#e2dfd5] bg-white p-5 shadow-2xs hover:border-[#0B63E5]/50 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-7 w-7 text-[#0B63E5]" />
                            <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                              {doc.category}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold font-mono">
                              {activeVer} Active
                            </span>
                            <button
                              onClick={() => setHistoryDoc(doc)}
                              className="rounded bg-stone-100 hover:bg-stone-200 p-1 text-stone-600 cursor-pointer"
                              title="View Full Version History"
                            >
                              <History className="h-3.5 w-3.5 text-[#0B63E5]" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-semibold text-stone-900 text-xs leading-snug line-clamp-2">
                          {doc.title}
                        </h3>

                        <div className="space-y-1 text-[11px] font-mono">
                          <p className="text-[#0B63E5] font-bold">{doc.matterRef}</p>
                          {doc.ctsReceiptNo && (
                            <p className="text-emerald-700 flex items-center space-x-1">
                              <FileCheck className="h-3 w-3 inline" />
                              <span>Receipt: {doc.ctsReceiptNo}</span>
                            </p>
                          )}
                        </div>

                        <div className="rounded bg-stone-50 border border-stone-200 p-2.5 text-[11px] text-stone-700 space-y-1">
                          <div className="flex items-center justify-between text-stone-500 text-[10px] font-semibold">
                            <span>Modified by {doc.uploadedBy}</span>
                            <span className="font-mono">{doc.uploadedDate}</span>
                          </div>
                          {doc.versions && doc.versions[0] && (
                            <p className="text-stone-800 text-[11px] italic line-clamp-2">
                              "{doc.versions[0].changeSummary}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-stone-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <button
                          onClick={() => setHistoryDoc(doc)}
                          className="flex items-center space-x-1 text-[#0B63E5] font-bold text-[11px] hover:underline cursor-pointer"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>History ({versionsCount} ver)</span>
                        </button>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              setSummarizeSelectedDoc(doc);
                              setIsAiSummarizeModalOpen(true);
                            }}
                            className="flex items-center space-x-1 rounded bg-[#ebf5fc] border border-[#c3e1f7] px-2 py-1 text-[11px] font-bold text-[#0070ba] hover:bg-[#dbeffd] transition-colors cursor-pointer"
                            title="Generate structured Case Brief"
                          >
                            <FileSearch className="h-3 w-3 text-[#0070ba]" />
                            <span>Case Brief</span>
                          </button>

                          <button
                            onClick={() => setUploadVersionDoc(doc)}
                            className="flex items-center space-x-1 rounded bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-800 hover:bg-stone-200 cursor-pointer"
                            title="Upload new revised version"
                          >
                            <Plus className="h-3 w-3" />
                            <span>New Ver</span>
                          </button>

                          {versionsCount > 1 && (
                            <button
                              onClick={() => handleOpenCompare(doc)}
                              className="flex items-center space-x-1 rounded bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-800 hover:bg-stone-200 cursor-pointer"
                              title="Compare versions diff"
                            >
                              <GitCompare className="h-3 w-3 text-stone-600" />
                              <span>Diff</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TIMELINE VIEW */
              <div className="space-y-4">
                {filtered.map((doc) => {
                  const isExpanded = expandedDocIds.includes(doc.id);
                  const versions = doc.versions || [];

                  return (
                    <div
                      key={doc.id}
                      className="rounded-lg border border-[#e2dfd5] bg-white shadow-2xs overflow-hidden"
                    >
                      <div
                        onClick={() => toggleExpandDoc(doc.id)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8f6f0] border-b border-[#e2dfd5] cursor-pointer hover:bg-stone-100/80 transition-colors gap-3"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-[#0B63E5] flex-shrink-0" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-stone-900 text-sm">{doc.title}</h3>
                              <span className="rounded bg-[#0B63E5] text-white px-2 py-0.5 text-[10px] font-bold">
                                {doc.category}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-[11px] font-mono text-stone-500 mt-0.5">
                              <span className="text-[#0B63E5] font-bold">{doc.matterRef}</span>
                              <span>•</span>
                              <span>Active: {doc.currentVersion || 'v1.0'}</span>
                              <span>•</span>
                              <span>{versions.length} Version(s) recorded</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSummarizeSelectedDoc(doc);
                              setIsAiSummarizeModalOpen(true);
                            }}
                            className="flex items-center space-x-1 rounded bg-[#ebf5fc] text-[#0070ba] border border-[#c3e1f7] px-3 py-1 text-xs font-bold hover:bg-[#dbeffd] transition-colors cursor-pointer"
                          >
                            <FileSearch className="h-3.5 w-3.5 text-[#0070ba]" />
                            <span>Case Brief</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadVersionDoc(doc);
                            }}
                            className="flex items-center space-x-1 rounded bg-[#0B63E5] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0256D0] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Revision</span>
                          </button>

                          <button className="text-stone-500 hover:text-stone-900 p-1">
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 bg-white space-y-4">
                          <div className="relative border-l-2 border-[#0B63E5]/30 ml-3 pl-6 space-y-6">
                            {versions.map((ver, idx) => (
                              <div key={ver.id || idx} className="relative">
                                <div
                                  className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-white ${
                                    ver.isCurrent ? 'border-emerald-600 bg-emerald-500 ring-2 ring-emerald-200' : 'border-[#0B63E5]'
                                  }`}
                                />

                                <div
                                  className={`rounded-lg border p-4 text-xs space-y-2.5 ${
                                    ver.isCurrent ? 'bg-emerald-50/20 border-emerald-300' : 'bg-stone-50/60 border-stone-200'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200 pb-2">
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`font-mono font-extrabold px-2 py-0.5 rounded text-[11px] ${
                                          ver.isCurrent ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-stone-200 text-stone-800'
                                        }`}
                                      >
                                        {ver.versionNumber}
                                      </span>
                                      {ver.isCurrent && (
                                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                          Current Active Version
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-3 text-[11px] text-stone-500 font-mono">
                                      <span>{ver.uploadedDate}</span>
                                      <span>by {ver.uploadedBy}</span>
                                    </div>
                                  </div>

                                  <p className="font-semibold text-stone-800 text-xs">{ver.changeSummary}</p>

                                  {!ver.isCurrent && (
                                    <button
                                      onClick={() => handleRestoreVersion(doc.id, ver)}
                                      className="flex items-center space-x-1.5 rounded bg-[#0B63E5] px-3 py-1 text-white font-bold hover:bg-[#0256D0] transition-colors cursor-pointer"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                      <span>Restore as Active Version</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: WORD DRAFTER & PDF EXPORT */}
      {activeMainTab === 'drafter' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Drafts List Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-[#e2dfd5] p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-bold text-stone-900 text-xs tracking-wider flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-[#0B63E5]" />
                <span>Saved Drafts ({drafts.length})</span>
              </h3>
              <button
                onClick={() => {
                  const newD: DocumentDraft = {
                    id: `draft-${Date.now()}`,
                    title: `New_Pleading_Draft_${Date.now().toString().slice(-4)}`,
                    matterRef: 'MAA/HC/COM/2026/0142',
                    category: 'Pleading',
                    content: 'REPUBLIC OF KENYA\nIN THE HIGH COURT OF KENYA AT NAIROBI\n...',
                    author: 'Adv. Costa Kimathi',
                    lastModified: 'Just now',
                    status: 'Draft',
                  };
                  setDrafts([newD, ...drafts]);
                  setActiveDraft(newD);
                  setDraftTitle(newD.title);
                  setDraftContent(newD.content);
                  showToast('New draft canvas opened.');
                }}
                className="rounded bg-[#0B63E5] text-white p-1 hover:bg-[#0256D0]"
                title="New Blank Draft"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {drafts.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    setActiveDraft(d);
                    setDraftTitle(d.title);
                    setDraftCategory(d.category);
                    setDraftMatterRef(d.matterRef);
                    setDraftContent(d.content);
                  }}
                  className={`rounded p-3 text-xs border cursor-pointer transition-all ${
                    activeDraft.id === d.id
                      ? 'border-[#0B63E5] bg-[#0B63E5]/5 font-bold'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <p className="font-bold text-stone-900 truncate">{d.title}</p>
                  <p className="text-[10px] text-[#0B63E5] font-mono mt-0.5">{d.matterRef}</p>
                  <p className="text-[10px] text-stone-400 mt-1">{d.lastModified}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Word Drafter Main Canvas */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-[#e2dfd5] shadow-2xs p-6 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full text-base font-bold font-serif text-stone-900 border-b border-dashed border-stone-300 focus:border-[#0B63E5] focus:outline-none bg-transparent"
                />
                <div className="flex items-center space-x-3 text-xs">
                  <select
                    value={draftMatterRef}
                    onChange={(e) => setDraftMatterRef(e.target.value)}
                    className="rounded border border-stone-300 bg-stone-50 p-1 font-mono font-bold text-stone-800"
                  >
                    <option value="MAA/HC/COM/2026/0142">MAA/HC/COM/2026/0142</option>
                    <option value="MAA/ELC/2026/0088">MAA/ELC/2026/0088</option>
                    <option value="MAA/HC/CON/2026/0019">MAA/HC/CON/2026/0019</option>
                    <option value="FIRM-GENERAL">FIRM-GENERAL</option>
                  </select>

                  <select
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value as any)}
                    className="rounded border border-stone-300 bg-stone-50 p-1 font-bold text-stone-800"
                  >
                    <option value="Pleading">Pleading</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Contract">Contract</option>
                    <option value="Legal Opinion">Legal Opinion</option>
                    <option value="Brief">Brief</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSummarizeSelectedDoc(null);
                    setSummarizeInitialText(draftContent);
                    setSummarizeInitialTitle(draftTitle);
                    setIsAiSummarizeModalOpen(true);
                  }}
                  className="flex items-center space-x-1 rounded bg-[#ebf5fc] text-[#0070ba] border border-[#c3e1f7] px-3 py-1.5 text-xs font-bold hover:bg-[#dbeffd] transition-colors cursor-pointer"
                  title="Generate structured Case Brief for active draft"
                >
                  <FileSearch className="h-3.5 w-3.5 text-[#0070ba]" />
                  <span>Synthesize Brief</span>
                </button>

                <button
                  onClick={() => handleSaveDraft(false)}
                  className="flex items-center space-x-1 rounded border border-stone-300 bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-200 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="flex items-center space-x-1 rounded bg-[#1a1d20] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800"
                >
                  <Printer className="h-3.5 w-3.5 text-[#93C5FD]" />
                  <span>Save / Export PDF</span>
                </button>

                <button
                  onClick={() => handleSaveDraft(true)}
                  className="flex items-center space-x-1 rounded bg-[#0B63E5] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0256D0]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Publish v1.0</span>
                </button>
              </div>
            </div>

            {/* Quick Templates Toolbar */}
            <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded border border-stone-200 text-xs">
              <span className="font-bold text-stone-600 text-[11px]">Insert Court Heading Template:</span>
              <div className="flex items-center space-x-2 overflow-x-auto">
                <button
                  onClick={() =>
                    setDraftContent(
                      (prev) =>
                        `REPUBLIC OF KENYA\nIN THE HIGH COURT OF KENYA AT NAIROBI\nMILIMANI COMMERCIAL COURT\nSUIT NO. E001 OF 2026\n\n` + prev
                    )
                  }
                  className="rounded bg-white border border-stone-300 px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:border-[#0B63E5]"
                >
                  + High Court Commercial Header
                </button>

                <button
                  onClick={() =>
                    setDraftContent(
                      (prev) =>
                        `REPUBLIC OF KENYA\nIN THE ENVIRONMENT & LAND COURT AT NAIROBI\nELC SUIT NO. 88 OF 2026\n\n` + prev
                    )
                  }
                  className="rounded bg-white border border-stone-300 px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:border-[#0B63E5]"
                >
                  + ELC Court Header
                </button>

                <button
                  onClick={() =>
                    setDraftContent(
                      (prev) =>
                        prev +
                        `\n\nSWORN at NAIROBI this _____ day of ____________ 2026.\n\nBEFORE ME:\n\n___________________________________\nCOMMISSIONER FOR OATHS`
                    )
                  }
                  className="rounded bg-white border border-stone-300 px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:border-[#0B63E5]"
                >
                  + Oath Swearing Clause
                </button>
              </div>
            </div>

            {/* Document Text Editor Area */}
            <textarea
              rows={18}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="w-full rounded border border-stone-300 bg-stone-50/50 p-5 font-serif text-sm leading-relaxed text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B63E5]"
            />

            <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono pt-1">
              <span>Words: {draftContent.split(/\s+/).filter(Boolean).length} | Chars: {draftContent.length}</span>
              <span>Author: {activeDraft.author}</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ONLINE CLIENT ONBOARDING PORTAL */}
      {activeMainTab === 'onboarding' && (
        <div className="space-y-5">
          {/* Header Card for Onboarding */}
          <div className="rounded-xl border border-[#0B63E5]/30 bg-gradient-to-r from-[#1a1d20] via-[#2a2e33] to-[#1a1d20] p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <UserPlus className="h-6 w-6 text-[#93C5FD]" />
                <h2 className="font-serif text-lg font-bold">Online Client Self-Service Onboarding Portal</h2>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                Clients fill in KYC data, KRA PIN details, matter description, and sign retainer agreements online. Auto-creates client folders in document repository upon advocate review.
              </p>
            </div>

            <button
              onClick={() => setIsOnboardingFormModalOpen(true)}
              className="flex items-center space-x-2 rounded bg-[#0B63E5] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0256D0] transition-colors self-start md:self-auto cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Online Client Intake Form</span>
            </button>
          </div>

          {/* Onboarding Submissions Queue */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 tracking-wider flex items-center space-x-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-[#0B63E5]" />
              <span>Pending & Completed Client Intake Submissions ({onboardings.length})</span>
            </h3>

            {onboardings.map((sub) => (
              <div
                key={sub.id}
                className={`rounded-lg border bg-white p-5 shadow-2xs space-y-3 transition-all ${
                  sub.status === 'Pending Review'
                    ? 'border-amber-300 bg-amber-50/20'
                    : sub.status === 'Onboarded & Matter Opened'
                    ? 'border-emerald-300'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1d20] font-serif font-bold text-white text-xs">
                      {sub.clientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{sub.clientName}</h4>
                      <p className="text-[11px] text-stone-500">
                        {sub.clientType} • {sub.idOrRegNo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded px-2.5 py-0.5 text-[10px] font-extrabold  tracking-wider ${
                        sub.status === 'Onboarded & Matter Opened'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : sub.status === 'Pending Review'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {sub.status}
                    </span>

                    {sub.status === 'Pending Review' && (
                      <button
                        onClick={() => handleApproveOnboarding(sub)}
                        className="flex items-center space-x-1 rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve & Open Folder</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Contact Email & Phone</span>
                    <span className="font-bold text-stone-800">{sub.email}</span>
                    <p className="text-stone-500 text-[11px]">{sub.phone}</p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Matter Description</span>
                    <span className="font-bold text-stone-900">{sub.matterType}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Assigned Partner</span>
                    <span className="font-bold text-[#0B63E5]">{sub.assignedAdvocate}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-stone-400">Agreed Retainer Deposit</span>
                    <span className="font-mono font-bold text-stone-900">KES {sub.retainerFeeKES.toLocaleString()}</span>
                  </div>
                </div>

                <div className="rounded bg-stone-50 border border-stone-200 p-2 text-xs text-stone-700">
                  <span className="font-bold text-stone-900">Intake Remarks: </span>
                  <span>{sub.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW FOLDER OR SUBFOLDER */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-stone-300 overflow-hidden text-stone-800">
            <div className="flex items-center justify-between bg-[#1a1d20] px-6 py-4 text-white">
              <div className="flex items-center space-x-2">
                <FolderPlus className="h-5 w-5 text-[#0B63E5]" />
                <h3 className="font-serif font-bold text-base">
                  {currentFolderId ? 'Create Sub-folder' : 'Create New Folder'}
                </h3>
              </div>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="rounded p-1 text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03 Supporting Affidavits or Commercial Contracts"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Matter Reference (Optional)</label>
                <select
                  value={newFolderMatterRef}
                  onChange={(e) => setNewFolderMatterRef(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none"
                >
                  <option value="MAA/HC/COM/2026/0142">MAA/HC/COM/2026/0142</option>
                  <option value="MAA/ELC/2026/0088">MAA/ELC/2026/0088</option>
                  <option value="FIRM-GENERAL">FIRM-GENERAL</option>
                </select>
              </div>

              <div className="border-t border-stone-200 pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="rounded border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-[#0B63E5] px-4 py-2 font-semibold text-white hover:bg-[#0256D0]">
                  Create Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VERSION HISTORY AUDIT DRAWER */}
      {historyDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-stone-300 overflow-hidden text-stone-800">
            <div className="flex items-center justify-between bg-[#1a1d20] px-6 py-4 text-white">
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5 text-[#0B63E5]" />
                <div>
                  <h3 className="font-serif font-bold text-base">Version History & Audit Log</h3>
                  <p className="text-[11px] text-stone-300 font-mono">{historyDoc.title}</p>
                </div>
              </div>
              <button onClick={() => setHistoryDoc(null)} className="rounded p-1 text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {(historyDoc.versions || []).map((ver) => (
                <div
                  key={ver.id}
                  className={`rounded-lg border p-4 space-y-2.5 transition-all ${
                    ver.isCurrent ? 'border-emerald-400 bg-emerald-50/30' : 'border-stone-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                      {ver.versionNumber}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">{ver.uploadedDate}</span>
                  </div>
                  <p className="font-bold text-stone-900 text-xs">{ver.changeSummary}</p>
                  {!ver.isCurrent && (
                    <button
                      onClick={() => handleRestoreVersion(historyDoc.id, ver)}
                      className="flex items-center space-x-1 rounded bg-[#0B63E5] px-3 py-1 text-xs font-bold text-white hover:bg-[#0256D0] cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore This Version</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD REVISED VERSION */}
      {uploadVersionDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-stone-300 overflow-hidden text-stone-800">
            <div className="flex items-center justify-between bg-[#1a1d20] px-6 py-4 text-white">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-[#0B63E5]" />
                <h3 className="font-serif font-bold text-base">Upload Revised Document Version</h3>
              </div>
              <button onClick={() => setUploadVersionDoc(null)} className="rounded p-1 text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadNewVersionSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">CTS e-Filing Receipt Ref</label>
                <input
                  type="text"
                  placeholder="e.g. CTS-2026-NBI-COM-1044"
                  value={newVersionCts}
                  onChange={(e) => setNewVersionCts(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Modification Audit Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe legal revisions..."
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900"
                />
              </div>

              <div className="border-t border-stone-200 pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUploadVersionDoc(null)}
                  className="rounded border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-[#0B63E5] px-4 py-2 font-semibold text-white hover:bg-[#0256D0]">
                  Save Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: UPLOAD NEW DOCUMENT */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-stone-300 overflow-hidden text-stone-800">
            <div className="flex items-center justify-between bg-[#1a1d20] px-6 py-4 text-white">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-[#0B63E5]" />
                <h3 className="font-serif font-bold text-base">Upload New Legal Document</h3>
              </div>
              <button onClick={() => setIsNewDocModalOpen(false)} className="rounded p-1 text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewDocumentSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Document Title / File Name</label>
                <input
                  type="text"
                  required
                  placeholder="Notice_of_Motion_2026.pdf"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900"
                />
              </div>

              <div className="border-t border-stone-200 pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="rounded border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-[#0B63E5] px-4 py-2 font-semibold text-white hover:bg-[#0256D0]">
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ONLINE CLIENT ONBOARDING SELF-SERVICE FORM */}
      {isOnboardingFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-stone-300 overflow-hidden text-stone-800">
            <div className="flex items-center justify-between bg-[#1a1d20] px-6 py-4 text-white">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-[#93C5FD]" />
                <div>
                  <h3 className="font-serif font-bold text-base">Muthoni & Ahago Advocates</h3>
                  <p className="text-[10px] text-stone-300 tracking-widest font-mono">
                    Online Client Intake & KYC Portal
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOnboardingFormModalOpen(false)} className="rounded p-1 text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Client / Corporate Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Safaricom PLC or Jane Doe"
                    value={onbClientName}
                    onChange={(e) => setOnbClientName(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Client Entity Type</label>
                  <select
                    value={onbClientType}
                    onChange={(e) => setOnbClientType(e.target.value as any)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-bold text-stone-900"
                  >
                    <option value="Individual">Individual Client</option>
                    <option value="Corporate / SME">Corporate / SME Company</option>
                    <option value="Government / State Agency">Government / State Agency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">National ID / KRA PIN / Reg No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ID 28910029 or KRA P051299102X"
                    value={onbIdNo}
                    onChange={(e) => setOnbIdNo(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+254 700 000 000"
                    value={onbPhone}
                    onChange={(e) => setOnbPhone(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="client@domain.co.ke"
                    value={onbEmail}
                    onChange={(e) => setOnbEmail(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    placeholder="1st Floor, The Triple Two Address, Ruiru"
                    value={onbAddress}
                    onChange={(e) => setOnbAddress(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Nature of Legal Matter</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Court Commercial Dispute / Property Conveyance Purchase"
                  value={onbMatterType}
                  onChange={(e) => setOnbMatterType(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Requested Partner / Advocate</label>
                  <select
                    value={onbAssignedAdv}
                    onChange={(e) => setOnbAssignedAdv(e.target.value)}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-semibold text-stone-900"
                  >
                    {staffList.map((adv) => (
                      <option key={adv.id} value={adv.name}>
                        {adv.name} ({adv.role || adv.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Proposed Retainer Deposit (KES)</label>
                  <input
                    type="number"
                    value={onbRetainer}
                    onChange={(e) => setOnbRetainer(Number(e.target.value))}
                    className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Digital Client Signature Confirmation</label>
                <input
                  type="text"
                  required
                  placeholder="Type Full Name to digitally sign Retainer Agreement"
                  value={onbSignature}
                  onChange={(e) => setOnbSignature(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-stone-50 p-2 text-xs font-serif italic text-stone-900"
                />
              </div>

              <div className="border-t border-stone-200 pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardingFormModalOpen(false)}
                  className="rounded border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-[#0B63E5] px-4 py-2 font-semibold text-white hover:bg-[#0256D0]">
                  Submit Intake Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Legal Summarizer Modal */}
      <AISummarizeModal
        isOpen={isAiSummarizeModalOpen}
        onClose={() => setIsAiSummarizeModalOpen(false)}
        document={summarizeSelectedDoc}
        initialText={summarizeInitialText}
        initialTitle={summarizeInitialTitle}
        onApplySummaryToDraft={(summaryText) => {
          setDraftContent((prev) => `${prev}\n\n--- AI CASE SUMMARY & ANALYSIS ---\n${summaryText}`);
          setActiveMainTab('drafter');
          showToast('AI Legal Summary appended to Word Drafter!');
        }}
      />
    </div>
  );
};
