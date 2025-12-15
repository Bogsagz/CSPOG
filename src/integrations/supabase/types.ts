export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          model_number: string | null
          name: string
          project_id: string
          type: string | null
          updated_at: string
          vendor: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          model_number?: string | null
          name: string
          project_id: string
          type?: string | null
          updated_at?: string
          vendor?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          model_number?: string | null
          name?: string
          project_id?: string
          type?: string | null
          updated_at?: string
          vendor?: string | null
          version?: string | null
        }
        Relationships: []
      }
      attack_detections: {
        Row: {
          analytics: string | null
          created_at: string
          description: string | null
          detection_id: string
          id: string
          log_sources: string[] | null
          name: string
          updated_at: string
        }
        Insert: {
          analytics?: string | null
          created_at?: string
          description?: string | null
          detection_id: string
          id?: string
          log_sources?: string[] | null
          name: string
          updated_at?: string
        }
        Update: {
          analytics?: string | null
          created_at?: string
          description?: string | null
          detection_id?: string
          id?: string
          log_sources?: string[] | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      attack_mitigations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mitigation_id: string
          name: string
          reference_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mitigation_id: string
          name: string
          reference_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mitigation_id?: string
          name?: string
          reference_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      attack_technique_detections: {
        Row: {
          created_at: string
          detection_id: string
          id: string
          technique_id: string
        }
        Insert: {
          created_at?: string
          detection_id: string
          id?: string
          technique_id: string
        }
        Update: {
          created_at?: string
          detection_id?: string
          id?: string
          technique_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attack_technique_detections_detection_id_fkey"
            columns: ["detection_id"]
            isOneToOne: false
            referencedRelation: "attack_detections"
            referencedColumns: ["id"]
          },
        ]
      }
      attack_technique_mitigations: {
        Row: {
          created_at: string
          id: string
          mitigation_id: string
          technique_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mitigation_id: string
          technique_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mitigation_id?: string
          technique_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attack_technique_mitigations_mitigation_id_fkey"
            columns: ["mitigation_id"]
            isOneToOne: false
            referencedRelation: "attack_mitigations"
            referencedColumns: ["id"]
          },
        ]
      }
      caf_assessment_responses: {
        Row: {
          created_at: string
          id: string
          outcome_id: string
          project_id: string
          question_id: string
          response: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          outcome_id: string
          project_id: string
          question_id: string
          response?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          outcome_id?: string
          project_id?: string
          question_id?: string
          response?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caf_assessment_responses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      caf_evidence_selections: {
        Row: {
          created_at: string
          evidence_item: string
          id: string
          outcome_id: string
          project_id: string
          selected: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_item: string
          id?: string
          outcome_id: string
          project_id: string
          selected?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_item?: string
          id?: string
          outcome_id?: string
          project_id?: string
          selected?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caf_evidence_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      caf_outcome_narratives: {
        Row: {
          created_at: string
          id: string
          narrative: string
          outcome_id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          narrative: string
          outcome_id: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          narrative?: string
          outcome_id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caf_outcome_narratives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      caf_question_evidence: {
        Row: {
          created_at: string
          evidence_item: string
          id: string
          outcome_id: string
          project_id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_item: string
          id?: string
          outcome_id: string
          project_id: string
          question_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_item?: string
          id?: string
          outcome_id?: string
          project_id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caf_question_evidence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      controls_repository: {
        Row: {
          category: string | null
          cloud_provider: string | null
          control_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          implementation_guidance: string | null
          name: string
          reference_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cloud_provider?: string | null
          control_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          implementation_guidance?: string | null
          name: string
          reference_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cloud_provider?: string | null
          control_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          implementation_guidance?: string | null
          name?: string
          reference_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      detection_log_sources: {
        Row: {
          channel: string
          created_at: string
          data_component: string
          data_source: string
          detection_id: string
          id: string
        }
        Insert: {
          channel: string
          created_at?: string
          data_component: string
          data_source: string
          detection_id: string
          id?: string
        }
        Update: {
          channel?: string
          created_at?: string
          data_component?: string
          data_source?: string
          detection_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detection_log_sources_detection_id_fkey"
            columns: ["detection_id"]
            isOneToOne: false
            referencedRelation: "attack_detections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_repository: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          document_type: string
          id: string
          name: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type: string
          id?: string
          name: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type?: string
          id?: string
          name?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          artefact_type: string
          created_at: string
          created_by: string | null
          id: string
          major_version: number
          minor_version: number
          project_id: string
          version_number: string
        }
        Insert: {
          artefact_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          major_version?: number
          minor_version?: number
          project_id: string
          version_number: string
        }
        Update: {
          artefact_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          major_version?: number
          minor_version?: number
          project_id?: string
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          created_at: string
          cve_score: string | null
          date_first_occurred: string | null
          date_resolved: string | null
          description: string | null
          epss_score: string | null
          id: string
          linked_asset_id: string | null
          name: string
          patch_available: boolean | null
          project_id: string
          resolution_plan: string | null
          type: Database["public"]["Enums"]["issue_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          cve_score?: string | null
          date_first_occurred?: string | null
          date_resolved?: string | null
          description?: string | null
          epss_score?: string | null
          id?: string
          linked_asset_id?: string | null
          name: string
          patch_available?: boolean | null
          project_id: string
          resolution_plan?: string | null
          type: Database["public"]["Enums"]["issue_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          cve_score?: string | null
          date_first_occurred?: string | null
          date_resolved?: string | null
          description?: string | null
          epss_score?: string | null
          id?: string
          linked_asset_id?: string | null
          name?: string
          patch_available?: boolean | null
          project_id?: string
          resolution_plan?: string | null
          type?: Database["public"]["Enums"]["issue_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_linked_asset_id_fkey"
            columns: ["linked_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      obligation_documents: {
        Row: {
          created_at: string
          document_id: string
          id: string
          obligation_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          obligation_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          obligation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligation_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_repository"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obligation_documents_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations: {
        Row: {
          compliance_framework: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          obligation_type: string | null
          owner: string | null
          project_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          compliance_framework?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          obligation_type?: string | null
          owner?: string | null
          project_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          compliance_framework?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          obligation_type?: string | null
          owner?: string | null
          project_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          disabled: boolean
          email: string | null
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          primary_role:
            | Database["public"]["Enums"]["organizational_role"]
            | null
          sfia_grade: number | null
          theme_preference: string | null
          updated_at: string
          username: string | null
          workstream: Database["public"]["Enums"]["workstream"] | null
        }
        Insert: {
          created_at?: string
          disabled?: boolean
          email?: string | null
          first_name?: string | null
          id: string
          last_login?: string | null
          last_name?: string | null
          primary_role?:
            | Database["public"]["Enums"]["organizational_role"]
            | null
          sfia_grade?: number | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
          workstream?: Database["public"]["Enums"]["workstream"] | null
        }
        Update: {
          created_at?: string
          disabled?: boolean
          email?: string | null
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          primary_role?:
            | Database["public"]["Enums"]["organizational_role"]
            | null
          sfia_grade?: number | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
          workstream?: Database["public"]["Enums"]["workstream"] | null
        }
        Relationships: []
      }
      project_assessment_documentation: {
        Row: {
          bia_completed: boolean | null
          bia_link: string | null
          created_at: string
          dpia_created: boolean | null
          dpia_link: string | null
          gov_assure_profile: string | null
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          bia_completed?: boolean | null
          bia_link?: string | null
          created_at?: string
          dpia_created?: boolean | null
          dpia_link?: string | null
          gov_assure_profile?: string | null
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          bia_completed?: boolean | null
          bia_link?: string | null
          created_at?: string
          dpia_created?: boolean | null
          dpia_link?: string | null
          gov_assure_profile?: string | null
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_deliverable_assignments: {
        Row: {
          created_at: string
          deliverable_name: string
          due_date: string | null
          effort_hours: number
          id: string
          is_completed: boolean
          owner_role: string
          project_id: string
          required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          deliverable_name: string
          due_date?: string | null
          effort_hours?: number
          id?: string
          is_completed?: boolean
          owner_role: string
          project_id: string
          required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          deliverable_name?: string
          due_date?: string | null
          effort_hours?: number
          id?: string
          is_completed?: boolean
          owner_role?: string
          project_id?: string
          required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deliverable_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_key_people: {
        Row: {
          created_at: string
          email: string
          first_name: string
          grade: string | null
          id: string
          last_name: string
          project_id: string
          role_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          grade?: string | null
          id?: string
          last_name: string
          project_id: string
          role_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          grade?: string | null
          id?: string
          last_name?: string
          project_id?: string
          role_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_security_scope: {
        Row: {
          created_at: string
          data_sharing_details: string | null
          id: string
          intellectual_property_details: string | null
          project_id: string
          requires_data_sharing: boolean | null
          third_party_providers_details: string | null
          updated_at: string
          uses_intellectual_property: boolean | null
          uses_third_party_providers: boolean | null
        }
        Insert: {
          created_at?: string
          data_sharing_details?: string | null
          id?: string
          intellectual_property_details?: string | null
          project_id: string
          requires_data_sharing?: boolean | null
          third_party_providers_details?: string | null
          updated_at?: string
          uses_intellectual_property?: boolean | null
          uses_third_party_providers?: boolean | null
        }
        Update: {
          created_at?: string
          data_sharing_details?: string | null
          id?: string
          intellectual_property_details?: string | null
          project_id?: string
          requires_data_sharing?: boolean | null
          third_party_providers_details?: string | null
          updated_at?: string
          uses_intellectual_property?: boolean | null
          uses_third_party_providers?: boolean | null
        }
        Relationships: []
      }
      project_time_allocation: {
        Row: {
          allocation_percentage: number
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_percentage?: number
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_percentage?: number
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_time_allocation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_time_allocation_history: {
        Row: {
          allocation_percentage: number
          created_at: string
          hours_worked: number | null
          id: string
          period_end: string | null
          period_start: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          allocation_percentage?: number
          created_at?: string
          hours_worked?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          allocation_percentage?: number
          created_at?: string
          hours_worked?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_time_allocation_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          anticipated_go_live: string | null
          complete_disposal: string | null
          created_at: string
          end_discovery: string | null
          end_live: string | null
          fleet_size: string | null
          id: string
          project_start: string | null
          secure_by_design_required: boolean
          security_phase: Database["public"]["Enums"]["project_phase"] | null
          title: string
          user_id: string | null
          workstream: Database["public"]["Enums"]["workstream"] | null
        }
        Insert: {
          anticipated_go_live?: string | null
          complete_disposal?: string | null
          created_at?: string
          end_discovery?: string | null
          end_live?: string | null
          fleet_size?: string | null
          id?: string
          project_start?: string | null
          secure_by_design_required?: boolean
          security_phase?: Database["public"]["Enums"]["project_phase"] | null
          title: string
          user_id?: string | null
          workstream?: Database["public"]["Enums"]["workstream"] | null
        }
        Update: {
          anticipated_go_live?: string | null
          complete_disposal?: string | null
          created_at?: string
          end_discovery?: string | null
          end_live?: string | null
          fleet_size?: string | null
          id?: string
          project_start?: string | null
          secure_by_design_required?: boolean
          security_phase?: Database["public"]["Enums"]["project_phase"] | null
          title?: string
          user_id?: string | null
          workstream?: Database["public"]["Enums"]["workstream"] | null
        }
        Relationships: []
      }
      rdd_options: {
        Row: {
          additional_benefits: string | null
          approach: string
          business_impacts: string | null
          created_at: string
          description: string | null
          id: string
          rdd_id: string
          residual_impact: string | null
          residual_likelihood: string | null
          resource_impacts: string | null
          secondary_risk_statement: string | null
        }
        Insert: {
          additional_benefits?: string | null
          approach: string
          business_impacts?: string | null
          created_at?: string
          description?: string | null
          id?: string
          rdd_id: string
          residual_impact?: string | null
          residual_likelihood?: string | null
          resource_impacts?: string | null
          secondary_risk_statement?: string | null
        }
        Update: {
          additional_benefits?: string | null
          approach?: string
          business_impacts?: string | null
          created_at?: string
          description?: string | null
          id?: string
          rdd_id?: string
          residual_impact?: string | null
          residual_likelihood?: string | null
          resource_impacts?: string | null
          secondary_risk_statement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rdd_options_rdd_id_fkey"
            columns: ["rdd_id"]
            isOneToOne: false
            referencedRelation: "risk_decision_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_links: {
        Row: {
          created_at: string
          id: string
          repository_requirement_id: string
          requirement_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          repository_requirement_id: string
          requirement_id: string
        }
        Update: {
          created_at?: string
          id?: string
          repository_requirement_id?: string
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_links_repository_requirement_id_fkey"
            columns: ["repository_requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements_repository"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_links_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          priority: string | null
          project_id: string
          source: string | null
          status: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          priority?: string | null
          project_id: string
          source?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          priority?: string | null
          project_id?: string
          source?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements_repository: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          reference_url: string | null
          requirement_type: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          reference_url?: string | null
          requirement_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          reference_url?: string | null
          requirement_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      risk_appetite: {
        Row: {
          category: string
          created_at: string
          id: string
          project_id: string
          risk_level: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          project_id: string
          risk_level: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          project_id?: string
          risk_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_controls: {
        Row: {
          control_id: string
          created_at: string
          id: string
          risk_id: string
        }
        Insert: {
          control_id: string
          created_at?: string
          id?: string
          risk_id: string
        }
        Update: {
          control_id?: string
          created_at?: string
          id?: string
          risk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_controls_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "security_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_controls_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "saved_risks"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_decision_documents: {
        Row: {
          background: string | null
          created_at: string
          id: string
          preferred_option_id: string | null
          project_id: string
          risk_id: string
          updated_at: string
        }
        Insert: {
          background?: string | null
          created_at?: string
          id?: string
          preferred_option_id?: string | null
          project_id: string
          risk_id: string
          updated_at?: string
        }
        Update: {
          background?: string | null
          created_at?: string
          id?: string
          preferred_option_id?: string | null
          project_id?: string
          risk_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_preferred_option"
            columns: ["preferred_option_id"]
            isOneToOne: false
            referencedRelation: "rdd_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_decision_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_decision_documents_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "saved_risks"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_issues: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          risk_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          risk_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          risk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_issues_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "saved_risks"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_risks: {
        Row: {
          base_impact: string | null
          base_likelihood: string | null
          created_at: string
          id: string
          impact_justification: string | null
          impact_type: string | null
          likelihood_justification: string | null
          modified_impact: string | null
          modified_likelihood: string | null
          project_id: string
          remediation_plan: string | null
          risk_rating: string | null
          risk_statement: string
          threat_id: string | null
        }
        Insert: {
          base_impact?: string | null
          base_likelihood?: string | null
          created_at?: string
          id?: string
          impact_justification?: string | null
          impact_type?: string | null
          likelihood_justification?: string | null
          modified_impact?: string | null
          modified_likelihood?: string | null
          project_id: string
          remediation_plan?: string | null
          risk_rating?: string | null
          risk_statement: string
          threat_id?: string | null
        }
        Update: {
          base_impact?: string | null
          base_likelihood?: string | null
          created_at?: string
          id?: string
          impact_justification?: string | null
          impact_type?: string | null
          likelihood_justification?: string | null
          modified_impact?: string | null
          modified_likelihood?: string | null
          project_id?: string
          remediation_plan?: string | null
          risk_rating?: string | null
          risk_statement?: string
          threat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_risks_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "saved_threats"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_threats: {
        Row: {
          created_at: string
          id: string
          parent_threat_id: string | null
          project_id: string
          stage: string
          threat_statement: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_threat_id?: string | null
          project_id: string
          stage?: string
          threat_statement: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_threat_id?: string | null
          project_id?: string
          stage?: string
          threat_statement?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_threats_parent_threat_id_fkey"
            columns: ["parent_threat_id"]
            isOneToOne: false
            referencedRelation: "saved_threats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_threats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      security_control_implementations: {
        Row: {
          control_repository_id: string
          created_at: string
          id: string
          security_control_id: string
        }
        Insert: {
          control_repository_id: string
          created_at?: string
          id?: string
          security_control_id: string
        }
        Update: {
          control_repository_id?: string
          created_at?: string
          id?: string
          security_control_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_control_implementations_control_repository_id_fkey"
            columns: ["control_repository_id"]
            isOneToOne: false
            referencedRelation: "controls_repository"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_control_implementations_security_control_id_fkey"
            columns: ["security_control_id"]
            isOneToOne: false
            referencedRelation: "security_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      security_controls: {
        Row: {
          created_at: string
          description: string | null
          effectiveness_rating: string | null
          id: string
          layer: number | null
          name: string
          project_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          effectiveness_rating?: string | null
          id?: string
          layer?: number | null
          name: string
          project_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          effectiveness_rating?: string | null
          id?: string
          layer?: number | null
          name?: string
          project_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_controls_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_diagrams: {
        Row: {
          created_at: string
          edges: Json
          id: string
          nodes: Json
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_diagrams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      table_items: {
        Row: {
          created_at: string
          id: string
          item_text: string
          project_id: string | null
          table_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_text: string
          project_id?: string | null
          table_type: string
        }
        Update: {
          created_at?: string
          id?: string
          item_text?: string
          project_id?: string | null
          table_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_leave: {
        Row: {
          absence_type: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          project_id: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          absence_type?: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          project_id?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          absence_type?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          project_id?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_leave_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_controls: {
        Row: {
          control_id: string
          created_at: string
          id: string
          threat_id: string
        }
        Insert: {
          control_id: string
          created_at?: string
          id?: string
          threat_id: string
        }
        Update: {
          control_id?: string
          created_at?: string
          id?: string
          threat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_controls_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "security_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threat_controls_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "saved_threats"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_log_sources: {
        Row: {
          created_at: string
          id: string
          log_source: string
          threat_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_source: string
          threat_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_source?: string
          threat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_log_sources_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "saved_threats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_deliverables: {
        Row: {
          created_at: string
          deliverable_name: string
          due_date: string | null
          estimated_effort_remaining: number
          id: string
          is_active: boolean | null
          is_completed: boolean
          project_id: string
          role: string
          started_working_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deliverable_name: string
          due_date?: string | null
          estimated_effort_remaining?: number
          id?: string
          is_active?: boolean | null
          is_completed?: boolean
          project_id: string
          role: string
          started_working_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deliverable_name?: string
          due_date?: string | null
          estimated_effort_remaining?: number
          id?: string
          is_active?: boolean | null
          is_completed?: boolean
          project_id?: string
          role?: string
          started_working_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          description: string | null
          feedback_type: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feedback_type: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feedback_type?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_workstream_assignments: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workstream: Database["public"]["Enums"]["workstream"]
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workstream: Database["public"]["Enums"]["workstream"]
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workstream?: Database["public"]["Enums"]["workstream"]
        }
        Relationships: [
          {
            foreignKeyName: "user_workstream_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_issue_number: { Args: { p_project_id: string }; Returns: string }
      get_email_from_username: {
        Args: { input_username: string }
        Returns: string
      }
      get_project_list: {
        Args: never
        Returns: {
          id: string
          title: string
        }[]
      }
      get_remaining_capacity: {
        Args: never
        Returns: {
          remaining_capacity: number
          user_id: string
        }[]
      }
      get_system_role_for_org_role: {
        Args: { org_role: Database["public"]["Enums"]["organizational_role"] }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_can_view_project_in_workstream: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_view_workstream_data: {
        Args: {
          _user_id: string
          _workstream: Database["public"]["Enums"]["workstream"]
        }
        Returns: boolean
      }
      user_can_write_risk_appetite: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_write_tables: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_write_threats: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_workstream_assignment: {
        Args: {
          _user_id: string
          _workstream: Database["public"]["Enums"]["workstream"]
        }
        Returns: boolean
      }
      user_is_security_admin: { Args: never; Returns: boolean }
      user_project_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["project_role"]
      }
    }
    Enums: {
      app_role:
        | "security_admin"
        | "security_user"
        | "security_delivery"
        | "security_mentor"
      issue_type: "vulnerability" | "weakness" | "other"
      organizational_role:
        | "delivery"
        | "sa_mentor"
        | "security_architect"
        | "risk_manager"
        | "sec_mon"
        | "sec_eng"
        | "admin"
      project_phase: "Discovery" | "Alpha" | "Live" | "Disposal"
      project_role:
        | "security_architect"
        | "risk_manager"
        | "sec_mon"
        | "sec_eng"
        | "delivery"
      workstream: "Mig" | "IE" | "Land" | "Sea" | "Plat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "security_admin",
        "security_user",
        "security_delivery",
        "security_mentor",
      ],
      issue_type: ["vulnerability", "weakness", "other"],
      organizational_role: [
        "delivery",
        "sa_mentor",
        "security_architect",
        "risk_manager",
        "sec_mon",
        "sec_eng",
        "admin",
      ],
      project_phase: ["Discovery", "Alpha", "Live", "Disposal"],
      project_role: [
        "security_architect",
        "risk_manager",
        "sec_mon",
        "sec_eng",
        "delivery",
      ],
      workstream: ["Mig", "IE", "Land", "Sea", "Plat"],
    },
  },
} as const
