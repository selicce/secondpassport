-- Seed data for the service catalogue + a sample client/company.
-- Run after 0001_init.sql. Profiles are created when real users sign up via
-- Supabase Auth (a trigger/edge function should insert the profile row).

insert into service_catalogue (category, title, short_description, description, jurisdiction, starting_price, currency, estimated_timeline, required_documents, disclaimers) values
('hk_company','Hong Kong Company Registration','Full incorporation of a Hong Kong private limited company.','End-to-end incorporation including name check, filing, BR Certificate, first-year secretary and registered address.','Hong Kong',1280,'USD','5–8 business days',
  '["Passport copy of each director and shareholder","Proof of residential address","Proposed company names (EN/ZH)","Intended business activities"]',
  '["Company registration is subject to approval by the Hong Kong Companies Registry.","A Significant Controllers Register must be maintained."]'),
('cn_wfoe','Mainland China WFOE Registration','Establish a wholly foreign-owned enterprise in Mainland China.','Coordination of WFOE establishment including name pre-approval, AMR registration, chops and tax registration.','Mainland China',null,'USD','20–40 business days',
  '["Parent company documents (notarized/legalized)","Passport of legal representative and supervisor","Office lease agreement","Proposed business scope"]',
  '["WFOE timelines and requirements vary by city.","Registered capital and scope are subject to local AMR approval."]'),
('hk_bank','Hong Kong Bank / Fintech Account Support','Preparation and coordination for corporate accounts.','KYC preparation, business profile drafting, and coordination with selected banks or fintechs.','Hong Kong',680,'USD','2–6 weeks (bank dependent)',
  '["Certificate of Incorporation & BR","Articles of Association","Passport & address proof of directors/UBOs","Business contracts or supplier info"]',
  '["Bank account approval is subject to the bank''s internal compliance review and is not guaranteed."]'),
('renewal','Company Renewal / Annual Maintenance','Annual return, BR renewal and company secretary.','Annual maintenance package covering BR renewal, NAR1 filing, secretary and registered address.','Hong Kong',850,'USD','Ongoing / annual',
  '["Updated register of members and directors (if changed)"]',
  '["Late filing of statutory returns may incur government penalties."]'),
('accounting','Accounting & Tax Filing','Bookkeeping, audit liaison and profits tax filing.','Periodic bookkeeping, management accounts, auditor liaison and profits tax return.',null,null,'USD','Ongoing',
  '["Bank statements","Sales and purchase invoices","Expense receipts"]',
  '["Information provided is for service coordination only unless confirmed in writing as formal tax advice."]'),
('immigration','Work / Residence Permit Support','Application support for work and residence permits.','Document preparation and coordination for employment visa / work permit and dependents.',null,null,'USD','Authority dependent',
  '["Passport","Academic & employment records","Company sponsorship documents"]',
  '["Immigration approvals are subject to review by the relevant authorities and are not guaranteed."]'),
('consultation','Advisory Consultation','Structured consultation with a JR & Firm advisor.','A scheduled consultation covering structuring, jurisdiction selection, banking or market entry.',null,200,'USD','Within 3 business days',
  '[]',
  '["Consultations are informational unless a formal engagement is confirmed in writing."]');

-- Sample client group (link real profiles to this id once users are created).
insert into clients (id, display_name, primary_contact_name, email, phone, nationality, country_of_residence, preferred_language, status, risk_rating)
values ('00000000-0000-0000-0000-0000000000a1','Aurelia Trading Group','Mei Lin Chow','meilin@aurelia-trading.com','+852 5123 8890','Malaysian','Hong Kong','en','active','low');

insert into companies (client_id, name, name_chinese, jurisdiction, company_number, incorporation_date, registered_address, business_scope, renewal_date, accounting_status, bank_account_status, status)
values ('00000000-0000-0000-0000-0000000000a1','Aurelia Trading (HK) Limited','雅麗貿易（香港）有限公司','Hong Kong','3128844','2025-10-14','Unit 1203, 12/F, Tower 2, Lippo Centre, Admiralty, Hong Kong','Wholesale and cross-border trade of consumer electronics.','2026-10-14','in_progress','approved','active');
