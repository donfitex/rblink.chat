import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Hash, ArrowRight, User } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    activeUser,
    updateProfile,
    channels,
    joinChannel,
    sendMessage,
    selectChannel,
    showToast
  } = useChat();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(activeUser.name);
  const [username, setUsername] = useState(activeUser.username);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Engineering', 'Design']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['c_general', 'c_engineering']);

  useEffect(() => {
    if (isOnboardingOpen) {
      setStep(1);
      setDisplayName(activeUser.name);
      setUsername(activeUser.username);
    }
  }, [isOnboardingOpen, activeUser]);

  if (!isOnboardingOpen) return null;

  const interestsList = [
    'Frontend & React',
    'Distributed Systems',
    'UI/UX Design',
    'Machine Learning',
    'Product Strategy',
    'DevOps & CI/CD',
    'Random Banter'
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  const handleFinish = () => {
    updateProfile({
      name: displayName.trim() || activeUser.name,
      username: username.trim() || activeUser.username,
      bio: `Interested in: ${selectedInterests.join(', ')}`
    });

    // Auto join selected channels
    selectedChannels.forEach((cId) => joinChannel(cId));

    // Send introduction message in #general
    sendMessage(
      `👋 Hi everyone! I just completed onboarding on **rblink.chat**. Excited to collaborate on ${selectedInterests.join(', ')}!`
    );

    selectChannel('c_general');
    setIsOnboardingOpen(false);
    showToast('Welcome to rblink.chat! Your profile is all set.', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsOnboardingOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-[#222529] border border-[#383F45] rounded-2xl shadow-2xl p-6 text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#1264A3]/20 text-[#68CDFF]">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8D9197]">
              Step {step} of 3
            </span>
          </div>
          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="text-[#8D9197] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Profile & Identity */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xl font-bold text-white">Welcome to rblink.chat! 🎉</h3>
            <p className="text-xs text-[#ABABAD] leading-relaxed">
              Let's get your profile set up so your teammates can recognize you.
            </p>

            <div className="flex items-center gap-4 py-2">
              <img
                src={activeUser.avatar}
                alt=""
                className="w-16 h-16 rounded-xl object-cover border border-[#383F45]"
              />
              <div className="text-xs text-[#8D9197]">
                <p className="font-semibold text-white">{activeUser.name}</p>
                <p>Avatar synced from your account</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                Username handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9197] text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Interests & Cohort Topics */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xl font-bold text-white">What are your focus areas? 🎯</h3>
            <p className="text-xs text-[#ABABAD]">
              Select topics you care about to personalize your suggested channels and cohorts.
            </p>

            <div className="flex flex-wrap gap-2 py-2">
              {interestsList.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selected
                        ? 'border-[#1264A3] bg-[#1264A3]/20 text-white'
                        : 'border-[#383F45] bg-[#1A1D21] text-[#ABABAD] hover:border-[#565D65]'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 inline mr-1 text-[#68CDFF]" />}
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg bg-[#2D3136] text-xs font-semibold text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Channels & Introduction */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xl font-bold text-white">Join Recommended Channels 🚀</h3>
            <p className="text-xs text-[#ABABAD]">
              We selected the top channels for you. You'll also send your introduction to #general!
            </p>

            <div className="space-y-2 py-1 max-h-48 overflow-y-auto">
              {channels.map((c) => {
                const isChecked = selectedChannels.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleChannel(c.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-[#1264A3] bg-[#1264A3]/10 text-white'
                        : 'border-[#383F45] bg-[#1A1D21] text-[#ABABAD]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className="w-4 h-4 text-[#1D9BD1]" />
                      <span className="font-semibold text-xs text-white truncate">#{c.name}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'border-[#1264A3] bg-[#1264A3] text-white' : 'border-[#565D65]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-[#2D3136] text-xs font-semibold text-white"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg"
              >
                Launch Workspace ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
