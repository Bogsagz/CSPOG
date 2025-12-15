-- Insert configurable application variables into app_settings

-- Risk categories
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'risk_categories',
  '["Human", "Financial", "Reputational", "Delivery", "Compliance"]'::jsonb,
  'Available risk categories for risk appetite capture'
);

-- Risk levels
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'risk_levels',
  '["Minor", "Moderate", "Major", "Significant", "Critical"]'::jsonb,
  'Risk severity levels from lowest to highest'
);

-- Fleet sizes
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'fleet_sizes',
  '["X-Wing", "Enterprise", "Red Dwarf", "Star Destroyer", "Death Star"]'::jsonb,
  'Available fleet size categories for projects'
);

-- Absence types
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'absence_types',
  '["leave", "sickness", "other", "working_elsewhere"]'::jsonb,
  'Types of absences that can be recorded for team members'
);

-- SFIA grades
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'sfia_grades',
  '[3, 4, 5, 6, 7]'::jsonb,
  'Available SFIA grade levels'
);

-- SFIA capacity mapping
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'sfia_capacity_mapping',
  '{"3": 11, "4": 21, "5": 31, "6": 42, "7": 50}'::jsonb,
  'Mapping of SFIA grades to capacity (hours per week)'
);

-- Business impact matrix
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'business_impact_matrix',
  '{
    "Human": {
      "Minor": "Lower-level harms such as anti-social behaviour. Human safety is compromised, but in a very low-level way;",
      "Moderate": "Fewer than 10 people are exposed to harm (injury, mental trauma and/or the infringement of rights)",
      "Major": "Between 10 and 100 people are exposed to harm (injury, mental trauma and/or the infringement of rights)",
      "Significant": "One or more employee, customer and/or member of the public is exposed to significant harm (injury, mental trauma and/or the infringement of rights) or more than 100 people are exposed to harm",
      "Critical": "One or more employee, customer and/or member of the public is exposed to serious harm (loss of life, severe injury and/or the infringements of rights)"
    },
    "Financial": {
      "Minor": "Unfunded pressures greater than 2% of the entity''s budget",
      "Moderate": "Unfunded pressures between 3 and 5% of the entity''s budget",
      "Major": "Unfunded pressures between 5 and 8% of the entity''s budget",
      "Significant": "Unfunded pressures between 8 and 10% of the entity''s budget",
      "Critical": "Unfunded pressures greater than 10% of the entity''s budget"
    },
    "Reputational": {
      "Minor": "Stakeholder/public criticism as anticipated or; Local level relationships, often internal (between individual managers and/or teams) damaged or compromised with a need to be rebuild trust",
      "Moderate": "Widespread stakeholder/public criticism and/or; Low-level embarrassment with a short-term impact that may warrant a letter of apology or other response",
      "Major": "Stakeholder/public trust or a key relationship is undermined for a brief period and/or; Potential embarrassment with a medium-term impact that may warrant a letter of apology or other response",
      "Significant": "Stakeholder/public trust or a key relationship is undermined for a sustained period or at a critical moment and/or; there is bad publicity",
      "Critical": "Stakeholder/public trust is destroyed or a key relationship is ruined and/or; there is a prolonged period of widespread bad publicity"
    },
    "Delivery": {
      "Minor": "No direct threat to key objectives but lower-level targets and goals are missed",
      "Moderate": "One or more key objective/project or programme deliverable is only just delivered (e.g. significant delay)",
      "Major": "One key objective/project or programme deliverable is not met",
      "Significant": "More than one key objective / project or programme deliverable is not met and/or one priority key objective/project or programme deliverable is not met",
      "Critical": "The majority of key objectives / project or programme deliverables are not met and/or; more than one priority objective/project or programme deliverable is not met"
    },
    "Compliance": {
      "Minor": "Low-level and potentially temporary divergence from relevant guidance/codes of practice",
      "Moderate": "Several low-level breaches of guidance/ codes of practice and/or one significant breach",
      "Major": "A single breach of our contractual, regulatory and/or statutory obligations",
      "Significant": "Several breaches of our contractual, regulatory and/ or statutory obligations or a single serious breach",
      "Critical": "Several serious breaches of our contractual, regulatory and/or statutory obligations"
    }
  }'::jsonb,
  'Matrix mapping risk impact types and levels to business impact descriptions'
);