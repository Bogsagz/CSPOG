-- Add detail fields to project_security_scope table
ALTER TABLE public.project_security_scope
ADD COLUMN third_party_providers_details text,
ADD COLUMN intellectual_property_details text,
ADD COLUMN data_sharing_details text;