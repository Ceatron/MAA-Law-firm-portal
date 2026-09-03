import { LegalTemplateVariable, LegalTemplate } from '../types';

export const TEMPLATE_VARIABLES: LegalTemplateVariable[] = [
  // Client Variables
  { key: 'client_name', label: 'Client Name', category: 'Client', example: 'Safaricom PLC' },
  { key: 'client_address', label: 'Client Physical Address', category: 'Client', example: 'HQ - Safaricom House, Waiyaki Way, Nairobi' },
  { key: 'client_pin', label: 'Client KRA PIN', category: 'Client', example: 'P051239841Z' },
  { key: 'client_email', label: 'Client Email', category: 'Client', example: 'legal@safaricom.co.ke' },
  { key: 'client_phone', label: 'Client Phone Number', category: 'Client', example: '+254 722 000 000' },

  // Matter Variables
  { key: 'matter_title', label: 'Matter Title / Case Name', category: 'Matter', example: 'Safaricom PLC v. Competition Authority of Kenya' },
  { key: 'matter_ref', label: 'Firm Workspace Ref Number', category: 'Matter', example: 'MAA/HC/COM/2026/0142' },
  { key: 'court_name', label: 'Court / Registry Name', category: 'Matter', example: 'High Court Commercial Div. - Milimani' },
  { key: 'court_case_number', label: 'Court Case / Petition No.', category: 'Matter', example: 'Civil Suit No. E142 of 2026' },
  { key: 'opposing_party', label: 'Opposing Party / Defendant', category: 'Matter', example: 'Competition Authority of Kenya (CAK)' },
  { key: 'advocate_assigned', label: 'Assigned Lead Advocate', category: 'Matter', example: 'Adv. Costa Kimathi (Partner)' },
  { key: 'claim_amount', label: 'Claim Value / Amount (KES)', category: 'Matter', example: '24,500,000' },
  { key: 'estimated_fee', label: 'Estimated Fee Note (KES)', category: 'Matter', example: '1,850,000' },

  // Firm Variables
  { key: 'firm_name', label: 'Firm Name', category: 'Firm', example: 'Muthoni Ahago Advocates' },
  { key: 'firm_address', label: 'Firm Address', category: 'Firm', example: '1st Floor, The Triple Two Address, Along the Eastern Bypass, Ruiru' },
  { key: 'firm_lsk_no', label: 'LSK Registration No.', category: 'Firm', example: 'LSK/FIRM/2026/0411' },
  { key: 'date_today', label: 'Today Date', category: 'Firm', example: '12th August 2026' },
];

export const INITIAL_TEMPLATES: LegalTemplate[] = [
  {
    id: 'tmpl-001',
    title: 'Plaint & Statement of Claim (High Court)',
    category: 'Pleading',
    description: 'Standard Civil Suit Plaint format for filing commercial or civil claims before the High Court of Kenya.',
    practiceArea: 'Civil Litigation',
    variables: ['court_name', 'court_case_number', 'client_name', 'opposing_party', 'matter_title', 'claim_amount', 'firm_name', 'firm_address', 'date_today'],
    createdDate: '2026-01-15',
    lastModified: '2026-08-10',
    author: 'Adv. Costa Kimathi',
    isSystemDefault: true,
    content: `IN THE {{court_name}}
AT MILIMANI LAW COURTS, NAIROBI
{{court_case_number}}

BETWEEN
{{client_name}} ................................................................ PLAINTIFF
AND
{{opposing_party}} ............................................................. DEFENDANT

PLAINT

1. The Plaintiff is a legal entity duly incorporated under the laws of Kenya, whose address for service for the purpose of this suit is care of {{firm_name}}, {{firm_address}}.

2. The Defendant is a corporate entity / individual residing and carrying on business within the jurisdiction of this Honourable Court.

3. RE: {{matter_title}}

4. On or about the relevant dates, the Plaintiff entered into a lawful agreement / transaction with the Defendant, wherein the Defendant incurred a liquidated sum of KES {{claim_amount}}.

5. Despite formal demand and notice of intention to sue, the Defendant has failed, neglected, or refused to settle the outstanding sum.

REASONS WHEREOF the Plaintiff prays for Judgment against the Defendant for:
(a) Payment of KES {{claim_amount}};
(b) Interest on (a) above at court rates from date of filing until payment in full;
(c) Costs of this suit;
(d) Any other or further relief that this Honourable Court may deem fit and just to grant.

DATED at RUIRU this {{date_today}}.

___________________________________________
{{firm_name}}
ADVOCATES FOR THE PLAINTIFF`
  },
  {
    id: 'tmpl-002',
    title: 'Affidavit of Service (Personal & E-Filing)',
    category: 'Affidavit',
    description: 'Affidavit verifying personal delivery or electronic email service of pleadings on opposing party under Order 5 of CPLR.',
    practiceArea: 'Civil Litigation',
    variables: ['court_name', 'court_case_number', 'client_name', 'opposing_party', 'advocate_assigned', 'firm_name', 'firm_address', 'date_today', 'matter_title'],
    createdDate: '2026-02-01',
    lastModified: '2026-08-01',
    author: 'Adv. Anne Muthoni',
    isSystemDefault: true,
    content: `IN THE {{court_name}}
{{court_case_number}}

BETWEEN
{{client_name}} ................................................................ APPLICANT
AND
{{opposing_party}} ............................................................. RESPONDENT

AFFIDAVIT OF SERVICE

I, {{advocate_assigned}}, an Advocate of the High Court of Kenya practicing under the firm of {{firm_name}}, {{firm_address}}, do hereby make oath and state as follows:

1. THAT I am an Advocate duly instructed by the Applicant in this matter and hence competent to swear this Affidavit.

2. THAT on {{date_today}}, I personally served the Respondent, {{opposing_party}}, with the Notice of Motion and supporting affidavits in respect of {{matter_title}}.

3. THAT service was effected via electronic mail and hand delivery at the Respondent's registered physical premises.

4. THAT the Respondent duly acknowledged receipt of the pleadings.

5. THAT what is stated hereinabove is true to the best of my knowledge, information, and belief.

SWORN by the said {{advocate_assigned}}
at Ruiru on {{date_today}}

BEFORE ME:

_____________________________________
COMMISSIONER FOR OATHS`
  },
  {
    id: 'tmpl-003',
    title: 'Client Legal Retainer & Fee Instruction Letter',
    category: 'Retainer',
    description: 'Formal engagement letter setting out legal instruction scope, Advocates Remuneration Order fees, and trust deposit rules.',
    practiceArea: 'All Practice Areas',
    variables: ['client_name', 'client_address', 'client_pin', 'matter_title', 'matter_ref', 'estimated_fee', 'firm_name', 'firm_address', 'date_today'],
    createdDate: '2026-01-10',
    lastModified: '2026-07-20',
    author: 'Adv. Costa Kimathi',
    isSystemDefault: true,
    content: `RETAINER & LEGAL SERVICE AGREEMENT

Date: {{date_today}}
Ref: {{matter_ref}}

TO:
{{client_name}}
Address: {{client_address}}
KRA PIN: {{client_pin}}

RE: INSTRUCTION TO ACT IN {{matter_title}}

We write to confirm receipt of your instructions appointing {{firm_name}}, located at {{firm_address}}, to represent your legal interests in respect of {{matter_title}}.

1. SCOPE OF ENGAGEMENT
Our firm shall provide legal representation, draft pleadings, attend court sessions, and conduct all necessary negotiations.

2. PROFESSIONAL FEES
In accordance with the Advocates Remuneration Order, the estimated professional fee for this matter is KES {{estimated_fee}} (exclusive of disbursements and VAT).

3. TRUST ACCOUNT DEPOSIT
A minimum deposit of 50% of the agreed fee note is payable into the Firm's Client Trust Account prior to commencement of court filings.

ACCEPTED AND AGREED BY CLIENT:

Signature: ______________________
Name: {{client_name}}
Date: {{date_today}}`
  },
  {
    id: 'tmpl-004',
    title: 'Formal Seven (7) Day Notice of Demand',
    category: 'Letter / Notice',
    description: 'Pre-litigation formal demand letter giving opposing party 7 days to settle outstanding debt before court filing.',
    practiceArea: 'Civil Litigation',
    variables: ['opposing_party', 'client_name', 'matter_title', 'claim_amount', 'firm_name', 'firm_address', 'date_today'],
    createdDate: '2026-03-05',
    lastModified: '2026-08-05',
    author: 'Adv. Grace Ahago',
    isSystemDefault: true,
    content: `FORMAL NOTICE OF DEMAND & INTENTION TO SUE

Date: {{date_today}}

TO:
{{opposing_party}}

RE: DEMAND FOR PAYMENT OF KES {{claim_amount}} — {{matter_title}}

We act for {{client_name}} ("Our Client"), on whose strict instructions we write to you as follows:

1. Our Client's records confirm that you owe an outstanding liquidated debt of KES {{claim_amount}} in respect of {{matter_title}}.

2. TAKE NOTICE that unless we receive full payment of KES {{claim_amount}} or an acceptable proposal for settlement within SEVEN (7) DAYS from the date of this letter, we have strict instructions to institute legal proceedings against you in court without any further reference to you.

3. Should suit be instituted, you shall be held liable for all legal costs and interest accrued thereon.

Yours faithfully,

___________________________________________
{{firm_name}}
ADVOCATES FOR {{client_name}}`
  },
  {
    id: 'tmpl-005',
    title: 'General Power of Attorney / Letter of Authority',
    category: 'General',
    description: 'Authorization letter authorizing assigned advocate to act, execute, and represent client before registries and courts.',
    practiceArea: 'Conveyancing Law',
    variables: ['client_name', 'client_pin', 'advocate_assigned', 'firm_name', 'firm_address', 'date_today'],
    createdDate: '2026-04-12',
    lastModified: '2026-07-15',
    author: 'Adv. Anne Muthoni',
    isSystemDefault: true,
    content: `GENERAL LETTER OF AUTHORITY

TO WHOM IT MAY CONCERN

I/We, {{client_name}} (KRA PIN: {{client_pin}}), do hereby nominate, constitute, and appoint {{advocate_assigned}} of {{firm_name}}, {{firm_address}}, to be my/our lawful Advocate and Attorney.

The said Advocate is authorized to execute documents, conduct title searches, file court pleadings, receive correspondence, and represent my/our legal interests before all Courts, Tribunals, and Government Registries in Kenya.

IN WITNESS WHEREOF I have hereunto set my hand at Ruiru this {{date_today}}.

Signed: __________________________
{{client_name}}`
  }
];
