-- Create document repository table for central storage of policies, standards, and laws
CREATE TABLE public.document_repository (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'policy', 'standard', 'law', 'framework', 'guidance'
  category TEXT, -- e.g., 'UK Law', 'International Standard', 'Government Policy'
  description TEXT,
  url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create linking table between obligations and documents
CREATE TABLE public.obligation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.document_repository(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(obligation_id, document_id)
);

-- Enable RLS
ALTER TABLE public.document_repository ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_repository
CREATE POLICY "Everyone can view documents"
ON public.document_repository
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add documents"
ON public.document_repository
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Security admins can update documents"
ON public.document_repository
FOR UPDATE
USING (user_is_security_admin());

CREATE POLICY "Security admins can delete documents"
ON public.document_repository
FOR DELETE
USING (user_is_security_admin());

-- RLS Policies for obligation_documents
CREATE POLICY "Members can view obligation documents"
ON public.obligation_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.obligations o
    WHERE o.id = obligation_documents.obligation_id
    AND user_has_project_access(auth.uid(), o.project_id)
  )
);

CREATE POLICY "Authorized members can link documents"
ON public.obligation_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obligations o
    WHERE o.id = obligation_documents.obligation_id
    AND user_can_write_tables(auth.uid(), o.project_id)
  )
);

CREATE POLICY "Authorized members can unlink documents"
ON public.obligation_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.obligations o
    WHERE o.id = obligation_documents.obligation_id
    AND user_can_write_tables(auth.uid(), o.project_id)
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_document_repository_updated_at
BEFORE UPDATE ON public.document_repository
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert comprehensive cybersecurity document repository
INSERT INTO public.document_repository (name, document_type, category, description, url) VALUES

-- UK Laws
('Data Protection Act 2018', 'law', 'UK Law', 'UK implementation of GDPR, governs processing of personal data', 'https://www.legislation.gov.uk/ukpga/2018/12/contents'),
('Computer Misuse Act 1990', 'law', 'UK Law', 'Criminalizes unauthorized access to computer systems', 'https://www.legislation.gov.uk/ukpga/1990/18/contents'),
('Network and Information Systems Regulations 2018', 'law', 'UK Law', 'Requirements for operators of essential services and digital service providers', 'https://www.legislation.gov.uk/uksi/2018/506/contents'),
('Investigatory Powers Act 2016', 'law', 'UK Law', 'Governs surveillance and interception capabilities', 'https://www.legislation.gov.uk/ukpga/2016/25/contents'),
('Electronic Communications Act 2000', 'law', 'UK Law', 'Facilitates electronic commerce and digital signatures', 'https://www.legislation.gov.uk/ukpga/2000/7/contents'),

-- European Laws
('GDPR (General Data Protection Regulation)', 'law', 'European Law', 'EU regulation on data protection and privacy', 'https://gdpr-info.eu/'),
('NIS2 Directive', 'law', 'European Law', 'Enhanced cybersecurity requirements for critical sectors', 'https://digital-strategy.ec.europa.eu/en/policies/nis2-directive'),
('eIDAS Regulation', 'law', 'European Law', 'Electronic identification and trust services', 'https://digital-strategy.ec.europa.eu/en/policies/eidas-regulation'),
('Cyber Resilience Act', 'law', 'European Law', 'Cybersecurity requirements for products with digital elements', 'https://digital-strategy.ec.europa.eu/en/library/cyber-resilience-act'),

-- International Standards
('ISO/IEC 27001:2022', 'standard', 'International Standard', 'Information security management systems requirements', 'https://www.iso.org/standard/27001'),
('ISO/IEC 27002:2022', 'standard', 'International Standard', 'Code of practice for information security controls', 'https://www.iso.org/standard/75652.html'),
('ISO/IEC 27005:2022', 'standard', 'International Standard', 'Information security risk management', 'https://www.iso.org/standard/80585.html'),
('ISO/IEC 27017:2015', 'standard', 'International Standard', 'Cloud security controls', 'https://www.iso.org/standard/43757.html'),
('ISO/IEC 27018:2019', 'standard', 'International Standard', 'Protection of PII in public clouds', 'https://www.iso.org/standard/76559.html'),
('ISO/IEC 27701:2019', 'standard', 'International Standard', 'Privacy information management systems', 'https://www.iso.org/standard/71670.html'),
('NIST Cybersecurity Framework 2.0', 'framework', 'International Standard', 'Framework for managing cybersecurity risk', 'https://www.nist.gov/cyberframework'),
('NIST SP 800-53 Rev. 5', 'standard', 'International Standard', 'Security and privacy controls for information systems', 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final'),
('CIS Controls v8', 'framework', 'International Standard', 'Prioritized set of actions to protect against cyber attacks', 'https://www.cisecurity.org/controls'),

-- UK Government Standards & Frameworks
('NCSC Cyber Assessment Framework (CAF)', 'framework', 'UK Government', 'Framework for assessing cybersecurity of CNI and public sector', 'https://www.ncsc.gov.uk/collection/caf'),
('Government Security Classifications', 'policy', 'UK Government', 'Classification scheme for government information', 'https://www.gov.uk/government/publications/government-security-classifications'),
('Security Policy Framework (SPF)', 'policy', 'UK Government', 'Mandatory requirements for protecting HMG assets', 'https://www.gov.uk/government/publications/security-policy-framework'),
('HMG IA Standard No. 1 & 2', 'standard', 'UK Government', 'Technical risk assessment and security architecture', 'https://www.gov.uk/government/publications/information-assurance-standards'),
('Cloud Security Principles', 'guidance', 'UK Government', 'NCSC principles for secure cloud adoption', 'https://www.ncsc.gov.uk/collection/cloud/the-cloud-security-principles'),
('Secure by Design', 'guidance', 'UK Government', 'NCSC guidance on building secure technology', 'https://www.ncsc.gov.uk/collection/developers-collection'),
('Cyber Essentials', 'framework', 'UK Government', 'Basic cyber hygiene certification scheme', 'https://www.ncsc.gov.uk/cyberessentials'),
('Cyber Essentials Plus', 'framework', 'UK Government', 'Enhanced cyber hygiene with technical verification', 'https://www.ncsc.gov.uk/cyberessentials/overview'),

-- Payment & Financial Standards
('PCI DSS v4.0', 'standard', 'Industry Standard', 'Payment Card Industry Data Security Standard', 'https://www.pcisecuritystandards.org/'),
('SOC 2', 'framework', 'Industry Standard', 'Service organization security controls audit', 'https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html'),

-- Industry-Specific
('HIPAA', 'law', 'US Law', 'Health Insurance Portability and Accountability Act', 'https://www.hhs.gov/hipaa/'),
('FISMA', 'law', 'US Law', 'Federal Information Security Management Act', 'https://www.cisa.gov/fisma'),

-- Privacy Standards
('Privacy by Design', 'framework', 'International Standard', 'Framework for embedding privacy into systems', 'https://www.ipc.on.ca/wp-content/uploads/resources/7foundationalprinciples.pdf'),
('ICO Data Protection Guidelines', 'guidance', 'UK Government', 'UK Information Commissioner guidance on data protection', 'https://ico.org.uk/for-organisations/guide-to-data-protection/');
