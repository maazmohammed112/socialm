import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageCircle, User, Users, Heart, Linkedin, Github, Mail } from 'lucide-react';

export function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b py-2 px-3 sm:py-4 sm:px-6 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png" alt="SocialChat Logo" className="h-6 sm:h-8 w-auto" />
            <span className="text-lg sm:text-xl font-bold font-pixelated social-gradient bg-clip-text text-transparent">SocialChat</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="font-pixelated text-xs sm:text-sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button className="btn-gradient font-pixelated text-xs sm:text-sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="dev-banner">
        This project is still under development by Mohammed Maaz A. Please share your feedback!
      </div>
      
      {/* Hero Section */}
      <section className="flex-1 py-10 sm:py-20 px-3 sm:px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center">
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="mb-4">
                <img src="/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png" alt="SocialChat Logo" className="h-12 sm:h-16 w-auto" />
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight font-pixelated" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Connect. Share. <span className="social-gradient bg-clip-text text-transparent">Engage.</span>
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground font-pixelated" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Join our vibrant social community where you can connect with friends, 
                share your thoughts, and engage in meaningful conversations.
              </p>
              <div className="mobile-buttons-container flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="default" className="btn-gradient hover-scale font-pixelated w-full sm:w-auto" style={{ fontSize: '13px' }}>
                    Get Started
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="default" variant="outline" className="hover-scale font-pixelated w-full sm:w-auto" style={{ fontSize: '13px' }}>
                    I already have an account
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative mt-8 sm:mt-0">
              <div className="absolute -z-10 inset-0 bg-social-green/20 blur-3xl rounded-full"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4 pt-0 sm:pt-10">
                  <div className="rounded-lg bg-white shadow-lg p-4 sm:p-6 glass-card animate-fade-in pixel-border pixel-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="text-social-green h-4 w-4 sm:h-5 sm:w-5" />
                      <h3 className="font-semibold font-pixelated text-xs sm:text-sm" style={{ fontSize: '13px' }}>Instant Messaging</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-pixelated" style={{ fontSize: '13px' }}>
                      Chat with friends in real-time.
                    </p>
                  </div>
                  <div className="rounded-lg bg-white shadow-lg p-4 sm:p-6 glass-card animate-fade-in pixel-border pixel-shadow" style={{animationDelay: '0.2s'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="text-social-purple h-4 w-4 sm:h-5 sm:w-5" />
                      <h3 className="font-semibold font-pixelated text-xs sm:text-sm" style={{ fontSize: '13px' }}>Personal Profiles</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-pixelated" style={{ fontSize: '13px' }}>
                      Create your unique identity.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg bg-white shadow-lg p-4 sm:p-6 glass-card animate-fade-in pixel-border pixel-shadow" style={{animationDelay: '0.1s'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="text-social-magenta h-4 w-4 sm:h-5 sm:w-5" />
                      <h3 className="font-semibold font-pixelated text-xs sm:text-sm" style={{ fontSize: '13px' }}>Community Posts</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-pixelated" style={{ fontSize: '13px' }}>
                      Share thoughts and engage.
                    </p>
                  </div>
                  <div className="rounded-lg bg-white shadow-lg p-4 sm:p-6 glass-card animate-fade-in pixel-border pixel-shadow" style={{animationDelay: '0.3s'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="text-social-green h-4 w-4 sm:h-5 sm:w-5" />
                      <h3 className="font-semibold font-pixelated text-xs sm:text-sm" style={{ fontSize: '13px' }}>Friend Networks</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-pixelated" style={{ fontSize: '13px' }}>
                      Build your personal network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t py-6 sm:py-8 bg-background">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            <img src="/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png" alt="SocialChat Logo" className="h-8 w-auto" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-center">
              <div className="space-y-3">
                <h3 className="font-pixelated text-sm font-medium" style={{ fontSize: '13px' }}>About</h3>
                <p className="font-pixelated text-muted-foreground" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  SocialChat is a real-time social messaging platform developed by a Bachelor of Computer Science student as a solo project.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-pixelated text-sm font-medium" style={{ fontSize: '13px' }}>Developer</h3>
                <p className="font-pixelated text-muted-foreground" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  Built solely by Mohammed Maaz A as part of Bachelor of Computer Science studies.
                </p>
                <div className="flex justify-center gap-3 mt-2">
                  <a 
                    href="https://www.linkedin.com/in/mohammed-maaz-a-0aa730217/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-pixelated text-social-green hover:text-social-light-green transition-colors"
                    style={{ fontSize: '13px' }}
                    aria-label="Mohammed Maaz's LinkedIn Profile"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only">LinkedIn</span>
                  </a>
                  <a 
                    href="https://github.com/maaaaz26" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-pixelated text-social-green hover:text-social-light-green transition-colors"
                    style={{ fontSize: '13px' }}
                    aria-label="Mohammed Maaz's GitHub Profile"
                  >
                    <Github className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only">GitHub</span>
                  </a>
                  <a 
                    href="mailto:contact@socialchat.site" 
                    className="inline-flex items-center gap-1 font-pixelated text-social-green hover:text-social-light-green transition-colors"
                    style={{ fontSize: '13px' }}
                    aria-label="Contact Mohammed Maaz"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only">Contact</span>
                  </a>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-pixelated text-sm font-medium" style={{ fontSize: '13px' }}>Company</h3>
                <p className="font-pixelated text-muted-foreground" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  Follow SocialChat for updates and new features
                </p>
                <a 
                  href="https://www.linkedin.com/company/socialchatmz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-pixelated text-social-green hover:text-social-light-green transition-colors"
                  style={{ fontSize: '13px' }}
                  aria-label="SocialChat Company LinkedIn Page"
                >
                  <Linkedin className="h-4 w-4" />
                  Company LinkedIn
                </a>
              </div>
            </div>
            
            <div className="border-t border-border/50 w-full max-w-4xl pt-4 mt-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <p className="font-pixelated text-muted-foreground text-center md:text-left" style={{ fontSize: '13px' }}>
                  © 2025 SocialChat. All rights reserved.
                </p>
                <div className="flex gap-4">
                  <a href="/privacy" className="font-pixelated text-muted-foreground hover:text-social-green transition-colors" style={{ fontSize: '13px' }}>Privacy Policy</a>
                  <a href="/terms" className="font-pixelated text-muted-foreground hover:text-social-green transition-colors" style={{ fontSize: '13px' }}>Terms of Service</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Index;