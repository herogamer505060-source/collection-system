export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contract_units: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          unit_id: string
          unit_order: number | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          unit_id: string
          unit_order?: number | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          unit_id?: string
          unit_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_units_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          actual_delivery_date: string | null
          collector_user_id: string | null
          contract_code: string | null
          contract_key: string
          contract_notes: string | null
          contract_status: string
          created_at: string
          customer_id: string
          delivery_date: string | null
          id: string
          project_id: string
          source_batch_id: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          collector_user_id?: string | null
          contract_code?: string | null
          contract_key: string
          contract_notes?: string | null
          contract_status?: string
          created_at?: string
          customer_id: string
          delivery_date?: string | null
          id?: string
          project_id: string
          source_batch_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          collector_user_id?: string | null
          contract_code?: string | null
          contract_key?: string
          contract_notes?: string | null
          contract_status?: string
          created_at?: string
          customer_id?: string
          delivery_date?: string | null
          id?: string
          project_id?: string
          source_batch_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_collector_user_id_fkey"
            columns: ["collector_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_source_batch_id_fkey"
            columns: ["source_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          content_type: string
          contract_id: string
          created_at: string
          document_type: string
          file_name: string
          file_size_bytes: number
          id: string
          notes: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          content_type?: string
          contract_id: string
          created_at?: string
          document_type?: string
          file_name: string
          file_size_bytes: number
          id?: string
          notes?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          content_type?: string
          contract_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          notes?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_project_identities: {
        Row: {
          created_at: string
          customer_id: string
          customer_import_key: string
          customer_name_raw: string | null
          id: string
          normalized_name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_import_key: string
          customer_name_raw?: string | null
          id?: string
          normalized_name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_import_key?: string
          customer_name_raw?: string | null
          id?: string
          normalized_name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_project_identities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_project_identities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          customer_key: string
          customer_name: string
          customer_name_raw: string | null
          email: string | null
          id: string
          mobile: string | null
          national_id: string | null
          normalized_name: string
          notes: string | null
          updated_at: string
          whatsapp_opted_out_at: string | null
          whatsapp_phone_normalized: string | null
        }
        Insert: {
          created_at?: string
          customer_key: string
          customer_name: string
          customer_name_raw?: string | null
          email?: string | null
          id?: string
          mobile?: string | null
          national_id?: string | null
          normalized_name: string
          notes?: string | null
          updated_at?: string
          whatsapp_opted_out_at?: string | null
          whatsapp_phone_normalized?: string | null
        }
        Update: {
          created_at?: string
          customer_key?: string
          customer_name?: string
          customer_name_raw?: string | null
          email?: string | null
          id?: string
          mobile?: string | null
          national_id?: string | null
          normalized_name?: string
          notes?: string | null
          updated_at?: string
          whatsapp_opted_out_at?: string | null
          whatsapp_phone_normalized?: string | null
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          collector_user_id: string | null
          contact_type: string
          contract_id: string | null
          created_at: string
          created_by: string
          customer_id: string
          customer_response: string | null
          follow_up_date: string
          follow_up_status: string
          id: string
          next_action_date: string | null
          note: string
          promise_date: string | null
          promised_to_pay: boolean
          updated_at: string
        }
        Insert: {
          collector_user_id?: string | null
          contact_type: string
          contract_id?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          customer_response?: string | null
          follow_up_date: string
          follow_up_status?: string
          id?: string
          next_action_date?: string | null
          note: string
          promise_date?: string | null
          promised_to_pay?: boolean
          updated_at?: string
        }
        Update: {
          collector_user_id?: string | null
          contact_type?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          customer_response?: string | null
          follow_up_date?: string
          follow_up_status?: string
          id?: string
          next_action_date?: string | null
          note?: string
          promise_date?: string | null
          promised_to_pay?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_collector_user_id_fkey"
            columns: ["collector_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          batch_type: string
          created_at: string
          created_by: string
          error_log: Json | null
          finished_at: string | null
          id: string
          issue_count: number
          previewed_at: string | null
          rows_imported: number
          rows_skipped: number
          rows_total: number
          rows_updated: number
          rows_valid: number
          started_at: string
          status: string
          summary_json: Json | null
          updated_at: string
        }
        Insert: {
          batch_type: string
          created_at?: string
          created_by: string
          error_log?: Json | null
          finished_at?: string | null
          id?: string
          issue_count?: number
          previewed_at?: string | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          rows_updated?: number
          rows_valid?: number
          started_at?: string
          status?: string
          summary_json?: Json | null
          updated_at?: string
        }
        Update: {
          batch_type?: string
          created_at?: string
          created_by?: string
          error_log?: Json | null
          finished_at?: string | null
          id?: string
          issue_count?: number
          previewed_at?: string | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          rows_updated?: number
          rows_valid?: number
          started_at?: string
          status?: string
          summary_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_files: {
        Row: {
          batch_id: string
          created_at: string
          detected_columns: Json | null
          file_name: string
          header_row_number: number | null
          id: string
          raw_rows_count: number
          rejected_rows_count: number
          sheet_name: string | null
          source_type: string
          storage_path: string
          valid_rows_count: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          detected_columns?: Json | null
          file_name: string
          header_row_number?: number | null
          id?: string
          raw_rows_count?: number
          rejected_rows_count?: number
          sheet_name?: string | null
          source_type: string
          storage_path: string
          valid_rows_count?: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          detected_columns?: Json | null
          file_name?: string
          header_row_number?: number | null
          id?: string
          raw_rows_count?: number
          rejected_rows_count?: number
          sheet_name?: string | null
          source_type?: string
          storage_path?: string
          valid_rows_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_files_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      import_issues: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          import_file_id: string | null
          issue_type: string
          message_ar: string
          payload: Json | null
          raw_value: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_row_number: number | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          import_file_id?: string | null
          issue_type: string
          message_ar: string
          payload?: Json | null
          raw_value?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source_row_number?: number | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          import_file_id?: string | null
          issue_type?: string
          message_ar?: string
          payload?: Json | null
          raw_value?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_row_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_issues_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_issues_import_file_id_fkey"
            columns: ["import_file_id"]
            isOneToOne: false
            referencedRelation: "import_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount_collected: number
          amount_due: number
          amount_outstanding: number
          commercial_paper: string | null
          contract_id: string
          created_at: string
          delay_bucket: string
          delay_days: number
          due_date: string
          id: string
          installment_code: string | null
          installment_key: string
          installment_type: string
          net_amount: number | null
          payment_date: string | null
          payment_status: string
          penalty_amount: number
          receipt_reference: string | null
          source_batch_id: string | null
          updated_at: string
        }
        Insert: {
          amount_collected?: number
          amount_due: number
          amount_outstanding?: number
          commercial_paper?: string | null
          contract_id: string
          created_at?: string
          delay_bucket?: string
          delay_days?: number
          due_date: string
          id?: string
          installment_code?: string | null
          installment_key: string
          installment_type: string
          net_amount?: number | null
          payment_date?: string | null
          payment_status: string
          penalty_amount?: number
          receipt_reference?: string | null
          source_batch_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_collected?: number
          amount_due?: number
          amount_outstanding?: number
          commercial_paper?: string | null
          contract_id?: string
          created_at?: string
          delay_bucket?: string
          delay_days?: number
          due_date?: string
          id?: string
          installment_code?: string | null
          installment_key?: string
          installment_type?: string
          net_amount?: number | null
          payment_date?: string | null
          payment_status?: string
          penalty_amount?: number
          receipt_reference?: string | null
          source_batch_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_source_batch_id_fkey"
            columns: ["source_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_project_id: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_project_id?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_project_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_project_id_fkey"
            columns: ["default_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          project_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          project_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          project_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          built_up_area: number | null
          contract_price: number | null
          created_at: string
          floor_name: string | null
          garden_area: number | null
          id: string
          list_price: number | null
          other_area: number | null
          project_id: string
          source_available: boolean
          source_batch_id: string | null
          source_sold: boolean
          status_conflict: boolean
          unit_code: string
          unit_key: string
          unit_status: string
          updated_at: string
        }
        Insert: {
          built_up_area?: number | null
          contract_price?: number | null
          created_at?: string
          floor_name?: string | null
          garden_area?: number | null
          id?: string
          list_price?: number | null
          other_area?: number | null
          project_id: string
          source_available?: boolean
          source_batch_id?: string | null
          source_sold?: boolean
          status_conflict?: boolean
          unit_code: string
          unit_key: string
          unit_status: string
          updated_at?: string
        }
        Update: {
          built_up_area?: number | null
          contract_price?: number | null
          created_at?: string
          floor_name?: string | null
          garden_area?: number | null
          id?: string
          list_price?: number | null
          other_area?: number | null
          project_id?: string
          source_available?: boolean
          source_batch_id?: string | null
          source_sold?: boolean
          status_conflict?: boolean
          unit_code?: string
          unit_key?: string
          unit_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_source_batch_id_fkey"
            columns: ["source_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          attempt_count: number
          contract_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          customer_wa_id: string | null
          dedupe_key: string | null
          delivered_at: string | null
          direction: string
          failed_at: string | null
          follow_up_id: string | null
          from_phone_number_id: string | null
          id: string
          installment_id: string | null
          last_attempt_at: string | null
          last_error_code: string | null
          last_error_message: string | null
          message_kind: string
          message_purpose: string
          meta_message_id: string | null
          parent_message_id: string | null
          project_id: string
          provider_request: Json | null
          provider_response: Json | null
          raw_message: Json | null
          read_at: string | null
          received_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          template_params: Json | null
          to_phone: string | null
          to_phone_normalized: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_wa_id?: string | null
          dedupe_key?: string | null
          delivered_at?: string | null
          direction: string
          failed_at?: string | null
          follow_up_id?: string | null
          from_phone_number_id?: string | null
          id?: string
          installment_id?: string | null
          last_attempt_at?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          message_kind: string
          message_purpose: string
          meta_message_id?: string | null
          parent_message_id?: string | null
          project_id: string
          provider_request?: Json | null
          provider_response?: Json | null
          raw_message?: Json | null
          read_at?: string | null
          received_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status: string
          template_id?: string | null
          template_params?: Json | null
          to_phone?: string | null
          to_phone_normalized?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_wa_id?: string | null
          dedupe_key?: string | null
          delivered_at?: string | null
          direction?: string
          failed_at?: string | null
          follow_up_id?: string | null
          from_phone_number_id?: string | null
          id?: string
          installment_id?: string | null
          last_attempt_at?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          message_kind?: string
          message_purpose?: string
          meta_message_id?: string | null
          parent_message_id?: string | null
          project_id?: string
          provider_request?: Json | null
          provider_response?: Json | null
          raw_message?: Json | null
          read_at?: string | null
          received_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          template_params?: Json | null
          to_phone?: string | null
          to_phone_normalized?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_follow_up_id_fkey"
            columns: ["follow_up_id"]
            isOneToOne: false
            referencedRelation: "follow_ups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          approval_status: string
          archived_at: string | null
          category: string
          components_json: Json
          created_at: string
          created_by: string | null
          id: string
          language_code: string
          meta_template_id: string | null
          project_id: string | null
          template_name: string
          updated_at: string
          version: number
        }
        Insert: {
          approval_status?: string
          archived_at?: string | null
          category: string
          components_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          language_code: string
          meta_template_id?: string | null
          project_id?: string | null
          template_name: string
          updated_at?: string
          version?: number
        }
        Update: {
          approval_status?: string
          archived_at?: string | null
          category?: string
          components_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          language_code?: string
          meta_template_id?: string | null
          project_id?: string | null
          template_name?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          created_at: string
          customer_wa_id: string | null
          event_timestamp: string | null
          event_type: string
          headers_json: Json | null
          id: string
          message_id: string | null
          meta_message_id: string | null
          payload: Json
          processed_at: string | null
          processing_error: string | null
          processing_status: string
          project_id: string | null
          provider_event_key: string
        }
        Insert: {
          created_at?: string
          customer_wa_id?: string | null
          event_timestamp?: string | null
          event_type: string
          headers_json?: Json | null
          id?: string
          message_id?: string | null
          meta_message_id?: string | null
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          project_id?: string | null
          provider_event_key: string
        }
        Update: {
          created_at?: string
          customer_wa_id?: string | null
          event_timestamp?: string | null
          event_type?: string
          headers_json?: Json | null
          id?: string
          message_id?: string | null
          meta_message_id?: string | null
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          project_id?: string | null
          provider_event_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhook_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_webhook_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
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
      can_access_contract: {
        Args: { target_collector_user_id: string; target_project_id: string }
        Returns: boolean
      }
      can_access_contract_id: {
        Args: { target_contract_id: string }
        Returns: boolean
      }
      can_access_customer: {
        Args: { target_customer_id: string }
        Returns: boolean
      }
      can_access_unit: {
        Args: { target_project_id: string; target_unit_id: string }
        Returns: boolean
      }
      can_manage_imports: { Args: never; Returns: boolean }
      can_read_follow_up: {
        Args: {
          target_collector_user_id: string
          target_contract_id: string
          target_created_by: string
          target_customer_id: string
        }
        Returns: boolean
      }
      can_read_imports: { Args: never; Returns: boolean }
      can_read_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      can_write_follow_up: {
        Args: {
          target_collector_user_id: string
          target_contract_id: string
          target_created_by: string
          target_customer_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: { target_project_id?: string; target_role: string }
        Returns: boolean
      }
      process_import_batch: {
        Args: { target_actor_id: string; target_batch_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
