'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody } from '@heroui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleSignInButton } from '@/components/google-signin-button';

interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  component?: React.ReactNode;
  timestamp: Date;
}

interface OnboardingState {
  step: 'welcome' | 'auth' | 'username' | 'profile' | 'complete';
  userInfo: {
    email?: string;
    name?: string;
    username?: string;
    profilePicture?: string;
  };
}

export function ConversationalOnboarding() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    step: 'welcome',
    userInfo: {}
  });
  const [isTyping, setIsTyping] = useState(false);

  const addMessage = (content: string, type: 'bot' | 'user' | 'system' = 'bot', component?: React.ReactNode) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      component,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = (duration: number = 1000) => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), duration);
  };

  useEffect(() => {
    // Initial welcome message
    setTimeout(() => {
      addMessage("👋 Hey there! Welcome to our AI-powered link bio tool!");
    }, 500);
    
    setTimeout(() => {
      addMessage("We're excited to help you create an amazing profile. Let's get started!");
    }, 1500);
    
    setTimeout(() => {
      addMessage("To begin, let's connect your account:", 'bot', 
        <Card className="mt-2 max-w-sm">
          <CardBody className="p-4">
            <GoogleSignInButton />
            <p className="text-xs text-gray-500 mt-2 text-center">
              We'll use this to personalize your experience
            </p>
          </CardBody>
        </Card>
      );
    }, 2500);
  }, []);

  const handleGoogleSignIn = (userInfo: { email: string; name: string }) => {
    addMessage(`Connected as ${userInfo.name}! 🎉`, 'system');
    
    setOnboardingState(prev => ({
      ...prev,
      step: 'username',
      userInfo: { ...prev.userInfo, ...userInfo }
    }));

    setTimeout(() => {
      simulateTyping();
      setTimeout(() => {
        addMessage(`Great! Now let's choose a username for your profile. This will be part of your unique link.`);
        addMessage(`How about we start with a suggestion?`, 'bot',
          <UsernameSelector 
            initialSuggestion={userInfo.name.toLowerCase().replace(/\s+/g, '')}
            onUsernameSelect={handleUsernameSelect}
          />
        );
      }, 1000);
    }, 1000);
  };

  const handleUsernameSelect = (username: string) => {
    addMessage(`Perfect! Your username is: @${username}`, 'user');
    
    setOnboardingState(prev => ({
      ...prev,
      step: 'profile',
      userInfo: { ...prev.userInfo, username }
    }));

    setTimeout(() => {
      simulateTyping();
      setTimeout(() => {
        addMessage(`Awesome! Your profile link will be: yoursite.com/${username}`);
        addMessage(`Now let's add some personal touches to make your profile shine! ✨`, 'bot',
          <ProfileCustomizer onProfileComplete={handleProfileComplete} />
        );
      }, 1000);
    }, 1000);
  };

  const handleProfileComplete = (profileData: any) => {
    addMessage(`Your profile looks amazing! 🎨`, 'system');
    
    setOnboardingState(prev => ({
      ...prev,
      step: 'complete',
      userInfo: { ...prev.userInfo, ...profileData }
    }));

    setTimeout(() => {
      addMessage(`🎉 Welcome to your new AI-powered profile! You're all set up and ready to share your story with the world.`);
      addMessage(`You can now chat with me anytime to update your profile, add new content, or get AI suggestions! 🤖`, 'bot',
        <Card className="mt-2 max-w-sm">
          <CardBody className="p-4 text-center">
            <Button color="primary" size="lg" className="w-full">
              Start Chatting! 💬
            </Button>
          </CardBody>
        </Card>
      );
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Chat Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">AI Profile Assistant</h1>
            <p className="text-sm text-gray-500">Here to help you get started</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : message.type === 'system'
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              } rounded-2xl px-4 py-3 shadow-md`}>
                <p className="text-sm">{message.content}</p>
                {message.component && (
                  <div className="mt-2">
                    {message.component}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Username Selector Component
function UsernameSelector({ 
  initialSuggestion, 
  onUsernameSelect 
}: { 
  initialSuggestion: string;
  onUsernameSelect: (username: string) => void;
}) {
  const [username, setUsername] = useState(initialSuggestion);
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) return;
    
    setIsChecking(true);
    // Simulate username availability check
    setTimeout(() => {
      setIsChecking(false);
      onUsernameSelect(username);
    }, 1000);
  };

  return (
    <Card className="mt-2 max-w-sm">
      <CardBody className="p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Choose your username:
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            startContent="@"
            className="mt-1"
          />
        </div>
        <Button 
          color="primary" 
          size="sm" 
          className="w-full"
          onPress={handleSubmit}
          isLoading={isChecking}
        >
          {isChecking ? 'Checking...' : 'Looks good!'}
        </Button>
      </CardBody>
    </Card>
  );
}

// Profile Customizer Component
function ProfileCustomizer({ 
  onProfileComplete 
}: { 
  onProfileComplete: (data: any) => void;
}) {
  const [bio, setBio] = useState('');
  const [step, setStep] = useState<'bio' | 'photos' | 'links'>('bio');

  const handleNext = () => {
    if (step === 'bio') {
      setStep('photos');
    } else if (step === 'photos') {
      setStep('links');
    } else {
      onProfileComplete({ bio });
    }
  };

  return (
    <Card className="mt-2 max-w-sm">
      <CardBody className="p-4 space-y-3">
        {step === 'bio' && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tell us about yourself:
              </label>
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="I'm passionate about..."
                className="mt-1"
              />
            </div>
            <Button 
              color="primary" 
              size="sm" 
              className="w-full"
              onPress={handleNext}
            >
              Continue
            </Button>
          </>
        )}
        
        {step === 'photos' && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📸 Photos and links can be added later in your profile!
            </p>
            <Button 
              color="primary" 
              size="sm" 
              className="w-full"
              onPress={handleNext}
            >
              Skip for now
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}