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
      users: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          email: string | null
          wechat_openid: string | null
          wechat_unionid: string | null
          plan: 'free' | 'lite' | 'pro'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          wechat_openid?: string | null
          wechat_unionid?: string | null
          plan?: 'free' | 'lite' | 'pro'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          wechat_openid?: string | null
          wechat_unionid?: string | null
          plan?: 'free' | 'lite' | 'pro'
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          userId: string
          title: string
          thumbnailUrl: string
          videoUrl: string
          duration: number
          createdAt: string
          status: 'completed' | 'processing' | 'failed'
        }
        Insert: {
          id?: string
          userId: string
          title: string
          thumbnailUrl: string
          videoUrl: string
          duration: number
          createdAt?: string
          status?: 'completed' | 'processing' | 'failed'
        }
        Update: {
          id?: string
          userId?: string
          title?: string
          thumbnailUrl?: string
          videoUrl?: string
          duration?: number
          createdAt?: string
          status?: 'completed' | 'processing' | 'failed'
        }
      }
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          price: number
          original_price: number | null
          bonus: number
          popular: boolean
          description: string
          sort_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          price: number
          original_price?: number | null
          bonus?: number
          popular?: boolean
          description: string
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          credits?: number
          price?: number
          original_price?: number | null
          bonus?: number
          popular?: boolean
          description?: string
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_orders: {
        Row: {
          id: string
          user_id: string
          package_id: string
          amount: number
          credits: number
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          wechat_order_id: string | null
          wechat_prepay_id: string | null
          paid_at: string | null
          created_at: string
          expired_at: string
        }
        Insert: {
          id: string
          user_id: string
          package_id: string
          amount: number
          credits: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          wechat_order_id?: string | null
          wechat_prepay_id?: string | null
          paid_at?: string | null
          created_at?: string
          expired_at: string
        }
        Update: {
          id?: string
          user_id?: string
          package_id?: string
          amount?: number
          credits?: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          wechat_order_id?: string | null
          wechat_prepay_id?: string | null
          paid_at?: string | null
          created_at?: string
          expired_at?: string
        }
      }
      user_credits: {
        Row: {
          user_id: string
          balance: number
          total_purchased: number
          total_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          balance?: number
          total_purchased?: number
          total_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          balance?: number
          total_purchased?: number
          total_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'purchase' | 'use' | 'refund' | 'bonus'
          amount: number
          balance: number
          package_id: string | null
          order_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'purchase' | 'use' | 'refund' | 'bonus'
          amount: number
          balance: number
          package_id?: string | null
          order_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'purchase' | 'use' | 'refund' | 'bonus'
          amount?: number
          balance?: number
          package_id?: string | null
          order_id?: string | null
          description?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: string
          p_description: string
          p_order_id?: string | null
          p_package_id?: string | null
        }
        Returns: void
      }
      deduct_user_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_description: string
        }
        Returns: boolean
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
