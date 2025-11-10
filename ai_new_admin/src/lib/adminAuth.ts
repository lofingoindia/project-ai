import { supabase } from './supabase';
import { comparePassword } from '../utils/passwordUtils';

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: AdminUser;
  token: string;
  expiresAt: string;
}

class AdminAuthService {
  private currentUser: AdminUser | null = null;

  constructor() {
    // Load session from localStorage on initialization
    this.loadSession();
  }

  async signIn(email: string, password: string): Promise<{ user: AdminUser }> {
    try {
      console.log('🔑 AdminAuth: Sign in attempt for:', email);
      
      // Fetch admin user from our custom table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        console.log('🔑 AdminAuth: User not found or inactive:', error);
        throw new Error('Invalid email or password');
      }

      console.log('🔑 AdminAuth: User found, verifying password');

      // Verify password using bcrypt
      const isPasswordValid = await comparePassword(password, adminUser.password_hash);
      
      if (!isPasswordValid) {
        console.log('🔑 AdminAuth: Password verification failed');
        throw new Error('Invalid email or password');
      }

      console.log('🔑 AdminAuth: Password verified, creating session');

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Store session in localStorage
      const session: AuthSession = {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: adminUser.role,
          is_active: adminUser.is_active,
          created_at: adminUser.created_at,
          updated_at: adminUser.updated_at
        },
        token: sessionToken,
        expiresAt
      };

      this.saveSession(session);
      this.currentUser = session.user;

      console.log('🔑 AdminAuth: Sign in successful for:', session.user.email);
      return { user: session.user };
    } catch (error) {
      console.log('🔑 AdminAuth: Sign in failed:', error);
      throw new Error('Invalid email or password');
    }
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('adminAuthSession');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
  }

  async getCurrentUser(): Promise<AdminUser | null> {
    console.log('🔑 AdminAuth: getCurrentUser called');
    // Check if session is still valid
    if (this.isSessionValid()) {
      console.log('🔑 AdminAuth: Session valid, returning current user:', this.currentUser?.email);
      return this.currentUser;
    } else {
      // Session expired, sign out
      console.log('🔑 AdminAuth: Session invalid/expired, signing out');
      await this.signOut();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.isSessionValid();
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem('adminAuthSession', JSON.stringify(session));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', session.user.email);
  }

  private loadSession(): void {
    try {
      const sessionData = localStorage.getItem('adminAuthSession');
      if (sessionData) {
        const session: AuthSession = JSON.parse(sessionData);
        
        // Check if session is still valid
        if (new Date() < new Date(session.expiresAt)) {
          this.currentUser = session.user;
        } else {
          // Session expired, clear it
          this.signOut();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.signOut();
    }
  }

  private isSessionValid(): boolean {
    const sessionData = localStorage.getItem('adminAuthSession');
    if (!sessionData) return false;

    try {
      const session: AuthSession = JSON.parse(sessionData);
      return new Date() < new Date(session.expiresAt);
    } catch (error) {
      return false;
    }
  }

  // Get current user info for UI display
  getUserInfo(): { email: string; fullName: string; role: string } | null {
    if (this.currentUser) {
      return {
        email: this.currentUser.email,
        fullName: this.currentUser.full_name,
        role: this.currentUser.role
      };
    }
    return null;
  }
}

// Export singleton instance
export const adminAuth = new AdminAuthService();
export default adminAuth;