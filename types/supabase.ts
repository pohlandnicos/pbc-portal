export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          org_id: string
          type: "private" | "company"
          company_name: string | null
          salutation: string | null
          first_name: string | null
          last_name: string | null
          description: string | null
          customer_number: string | null
          leitweg_id: string | null
          supplier_number: string | null
          vendor_number: string | null
          vat_id: string | null
          billing_street: string
          billing_house_number: string
          billing_address_extra: string | null
          billing_postal_code: string
          billing_city: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          type: "private" | "company"
          company_name?: string | null
          salutation?: string | null
          first_name?: string | null
          last_name?: string | null
          description?: string | null
          customer_number?: string | null
          leitweg_id?: string | null
          supplier_number?: string | null
          vendor_number?: string | null
          vat_id?: string | null
          billing_street: string
          billing_house_number: string
          billing_address_extra?: string | null
          billing_postal_code: string
          billing_city: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          type?: "private" | "company"
          company_name?: string | null
          salutation?: string | null
          first_name?: string | null
          last_name?: string | null
          description?: string | null
          customer_number?: string | null
          leitweg_id?: string | null
          supplier_number?: string | null
          vendor_number?: string | null
          vat_id?: string | null
          billing_street?: string
          billing_house_number?: string
          billing_address_extra?: string | null
          billing_postal_code?: string
          billing_city?: string
          created_at?: string
          updated_at?: string
        }
      }
      offer_groups: {
        Row: {
          id: string
          org_id: string
          offer_id: string
          index: number
          title: string
          material_cost: number
          labor_cost: number
          other_cost: number
          material_margin: number
          labor_margin: number
          other_margin: number
          total_net: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          offer_id: string
          index: number
          title: string
          material_cost?: number
          labor_cost?: number
          other_cost?: number
          material_margin?: number
          labor_margin?: number
          other_margin?: number
          total_net?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          offer_id?: string
          index?: number
          title?: string
          material_cost?: number
          labor_cost?: number
          other_cost?: number
          material_margin?: number
          labor_margin?: number
          other_margin?: number
          total_net?: number
          created_at?: string
          updated_at?: string
        }
      }
      offer_items: {
        Row: {
          id: string
          org_id: string
          offer_group_id: string
          type: "material" | "labor" | "mixed" | "other"
          position_index: string
          name: string
          description: string | null
          qty: number
          unit: string
          purchase_price: number
          markup_percent: number
          margin_amount: number
          unit_price: number
          line_total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          offer_group_id: string
          type: "material" | "labor" | "mixed" | "other"
          position_index: string
          name: string
          description?: string | null
          qty?: number
          unit?: string
          purchase_price?: number
          markup_percent?: number
          margin_amount?: number
          unit_price?: number
          line_total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          offer_group_id?: string
          type?: "material" | "labor" | "mixed" | "other"
          position_index?: string
          name?: string
          description?: string | null
          qty?: number
          unit?: string
          purchase_price?: number
          markup_percent?: number
          margin_amount?: number
          unit_price?: number
          line_total?: number
          created_at?: string
          updated_at?: string
        }
      }
      offer_templates: {
        Row: {
          id: string
          org_id: string
          type: "intro" | "outro"
          name: string
          salutation: string | null
          body_html: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          type: "intro" | "outro"
          name: string
          salutation?: string | null
          body_html: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          type?: "intro" | "outro"
          name?: string
          salutation?: string | null
          body_html?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          org_id: string
          customer_id: string
          project_id: string | null
          offer_date: string
          offer_number: string | null
          title: string
          status: "draft" | "sent" | "accepted" | "rejected" | "cancelled"
          intro_salutation: string | null
          intro_body_html: string | null
          outro_body_html: string | null
          payment_due_days: number
          discount_percent: number | null
          discount_days: number | null
          tax_rate: number
          show_vat_for_labor: boolean
          total_net: number
          total_tax: number
          total_gross: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          customer_id: string
          project_id?: string | null
          offer_date: string
          offer_number?: string | null
          title: string
          status?: "draft" | "sent" | "accepted" | "rejected" | "cancelled"
          intro_salutation?: string | null
          intro_body_html?: string | null
          outro_body_html?: string | null
          payment_due_days?: number
          discount_percent?: number | null
          discount_days?: number | null
          tax_rate?: number
          show_vat_for_labor?: boolean
          total_net?: number
          total_tax?: number
          total_gross?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          customer_id?: string
          project_id?: string | null
          offer_date?: string
          offer_number?: string | null
          title?: string
          status?: "draft" | "sent" | "accepted" | "rejected" | "cancelled"
          intro_salutation?: string | null
          intro_body_html?: string | null
          outro_body_html?: string | null
          payment_due_days?: number
          discount_percent?: number | null
          discount_days?: number | null
          tax_rate?: number
          show_vat_for_labor?: boolean
          total_net?: number
          total_tax?: number
          total_gross?: number
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          org_id: string
          customer_id: string
          title: string
          project_number: string | null
          received_at: string
          description: string | null
          status: "open" | "in_progress" | "done" | "cancelled"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          customer_id: string
          title: string
          project_number?: string | null
          received_at: string
          description?: string | null
          status?: "open" | "in_progress" | "done" | "cancelled"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          customer_id?: string
          title?: string
          project_number?: string | null
          received_at?: string
          description?: string | null
          status?: "open" | "in_progress" | "done" | "cancelled"
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
