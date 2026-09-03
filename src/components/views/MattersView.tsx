import React, { useState } from 'react';
import {
  LegalMatter,
  Advocate,
} from '../../types';
import { loadVisibleStaffRoster } from '../../utils/staffStorage';
import { MattersTable } from '../MattersTable';
import { CaseLifecycleChart } from '../CaseLifecycleChart';
import { WorkloadChart } from '../WorkloadChart';
import { MattersExportPdfModal } from '../MattersExportPdfModal';

interface MattersViewProps {
  matters: LegalMatter[];
  onSelectMatter: (matter: LegalMatter) => void;
  onOpenNewMatter: () => void;
  onUpdateMatterTags?: (matterId: string, tags: string[]) => void;
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  allAdvocates?: Advocate[];
}

export const MattersView: React.FC<MattersViewProps> = ({
  matters,
  onSelectMatter,
  onOpenNewMatter,
  onUpdateMatterTags,
  currentAdvocate,
  isManagingAdvocate = true,
  allAdvocates = loadVisibleStaffRoster(),
}) => {
  const [mattersSubView, setMattersSubView] = useState<'all' | 'archived' | 'analytics'>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Scoped matters based on advocate permissions
  const activeMatters = matters.filter((m) => m.status !== 'Archived');
  const archivedMatters = matters.filter((m) => m.status === 'Archived');

  return (
    <div className="space-y-6">
      {/* Matters Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Matters
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Active files, commercial transactions and registry filings across chambers.
          </p>
        </div>

        {/* Header Actions: Only Export PDF and New matter */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onOpenNewMatter}
            className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition cursor-pointer"
          >
            New matter
          </button>
        </div>
      </div>

      {/* Real Tabs Strip under Header */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Matters Tabs">
          <button
            type="button"
            onClick={() => setMattersSubView('all')}
            className={`pb-2.5 text-xs font-medium transition cursor-pointer relative ${
              mattersSubView === 'all'
                ? 'font-semibold text-slate-900 border-b-2 border-amber-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active matters
          </button>

          <button
            type="button"
            onClick={() => setMattersSubView('archived')}
            className={`pb-2.5 text-xs font-medium transition cursor-pointer relative ${
              mattersSubView === 'archived'
                ? 'font-semibold text-slate-900 border-b-2 border-amber-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Archived register
          </button>

          <button
            type="button"
            onClick={() => setMattersSubView('analytics')}
            className={`pb-2.5 text-xs font-medium transition cursor-pointer relative ${
              mattersSubView === 'analytics'
                ? 'font-semibold text-slate-900 border-b-2 border-amber-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Sub-view Content */}
      {mattersSubView === 'all' && (
        <MattersTable
          matters={activeMatters}
          onSelectMatter={onSelectMatter}
          onOpenNewMatter={onOpenNewMatter}
          onUpdateMatterTags={onUpdateMatterTags}
          currentAdvocate={currentAdvocate}
          isManagingAdvocate={isManagingAdvocate}
          allAdvocates={allAdvocates}
          onTriggerExport={() => setIsExportModalOpen(true)}
        />
      )}

      {mattersSubView === 'archived' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <MattersTable
            matters={archivedMatters}
            onSelectMatter={onSelectMatter}
            onOpenNewMatter={onOpenNewMatter}
            onUpdateMatterTags={onUpdateMatterTags}
            currentAdvocate={currentAdvocate}
            isManagingAdvocate={isManagingAdvocate}
            allAdvocates={allAdvocates}
            isArchivedView
            onTriggerExport={() => setIsExportModalOpen(true)}
          />
        </div>
      )}

      {mattersSubView === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <CaseLifecycleChart />
          <WorkloadChart advocates={allAdvocates} />
          <MattersTable
            matters={activeMatters}
            onSelectMatter={onSelectMatter}
            onOpenNewMatter={onOpenNewMatter}
            onUpdateMatterTags={onUpdateMatterTags}
            currentAdvocate={currentAdvocate}
            isManagingAdvocate={isManagingAdvocate}
            allAdvocates={allAdvocates}
            onTriggerExport={() => setIsExportModalOpen(true)}
          />
        </div>
      )}

      {/* Export PDF Modal */}
      <MattersExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        matters={mattersSubView === 'archived' ? archivedMatters : activeMatters}
        currentAdvocate={currentAdvocate}
        isManagingAdvocate={isManagingAdvocate}
      />
    </div>
  );
};
