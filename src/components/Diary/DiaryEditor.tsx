import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { DiaryEntry, MOOD_OPTIONS, WEATHER_OPTIONS, ACTIVITY_OPTIONS } from '../../types/diary';
import { addDiaryEntry, updateDiaryEntry } from '../../store/diarySlice';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  entry?: DiaryEntry;
  onClose: () => void;
}

const DiaryEditor: React.FC<Props> = ({ entry, onClose }) => {
  const dispatch = useDispatch();
  const isEditing = !!entry;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [moodScore, setMoodScore] = useState(entry?.moodScore || 5);
  const [weather, setWeather] = useState(entry?.weather || '');
  const [location, setLocation] = useState(entry?.location || '');
  const [activities, setActivities] = useState<string[]>(entry?.activities || []);
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [images, setImages] = useState<string[]>(entry?.images || []);
  const [isPrivate, setIsPrivate] = useState(entry?.isPrivate || false);
  const [tagInput, setTagInput] = useState('');

  const steps = [
    { id: 'mood', title: '今天心情如何？', icon: '😊' },
    { id: 'weather', title: '今天天气怎么样？', icon: '🌤️' },
    { id: 'activities', title: '今天做了什么？', icon: '🎯' },
    { id: 'content', title: '想要记录些什么？', icon: '✍️' },
    { id: 'extras', title: '还有其他想添加的吗？', icon: '📸' },
  ];

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('请至少写点什么吧～');
      return;
    }

    const now = new Date().toISOString();
    const selectedMood = MOOD_OPTIONS.find(option => option.value === mood);

    if (isEditing && entry) {
      const updatedEntry: DiaryEntry = {
        ...entry,
        title: title || `${new Date().toLocaleDateString()} 的日记`,
        content,
        mood,
        moodScore: selectedMood?.score || moodScore,
        weather,
        location,
        activities,
        tags,
        images,
        isPrivate,
        updatedAt: now,
      };
      dispatch(updateDiaryEntry(updatedEntry));
    } else {
      const newEntry: DiaryEntry = {
        id: uuidv4(),
        title: title || `${new Date().toLocaleDateString()} 的日记`,
        content,
        mood,
        moodScore: selectedMood?.score || moodScore,
        weather,
        location,
        activities,
        tags,
        images,
        isPrivate,
        createdAt: now,
        updatedAt: now,
      };
      dispatch(addDiaryEntry(newEntry));
    }

    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleActivityToggle = (activityValue: string) => {
    if (activities.includes(activityValue)) {
      setActivities(activities.filter(a => a !== activityValue));
    } else {
      setActivities([...activities, activityValue]);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // 这里应该上传到服务器，现在只是模拟
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'mood':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🐰</div>
              <p className="text-gray-600 mb-6">Moo想知道你今天的心情～</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setMood(option.value);
                    setMoodScore(option.score);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    mood === option.value
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {mood && (
              <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-700 text-center">
                  心情评分：{moodScore}/10 ✨
                </p>
              </div>
            )}
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🌤️</div>
              <p className="text-gray-600 mb-6">今天的天气如何呢？</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {WEATHER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setWeather(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    weather === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="在哪里呢？（可选）"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600 mb-6">今天都做了什么呢？</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleActivityToggle(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    activities.includes(option.value)
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{option.emoji}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">✍️</div>
              <p className="text-gray-600 mb-6">想要记录些什么呢？</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给今天起个标题吧～"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={8}
                placeholder="今天发生了什么有趣的事情呢？心情如何？有什么想法想要记录下来吗？

Moo会替你守护这些珍贵的回忆～ 🐰💕"
              />
            </div>
          </div>
        );

      case 'extras':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-600 mb-6">还想添加些什么吗？</p>
            </div>

            <div className="space-y-4">
              {/* 图片上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加照片
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors"
                >
                  <div className="text-2xl mb-2">📷</div>
                  <div className="text-sm text-gray-600">点击添加照片</div>
                </button>
                
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`上传的图片 ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加标签
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="输入标签"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    添加
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 隐私设置 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-700">私密日记</div>
                  <div className="text-sm text-gray-500">只有你能看到</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isPrivate ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      isPrivate ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{steps[currentStep].icon}</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {isEditing ? '编辑日记' : steps[currentStep].title}
                </h2>
                <div className="text-sm text-gray-500">
                  第 {currentStep + 1} 步，共 {steps.length} 步
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 进度条 */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-100 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            上一步
          </button>

          <div className="flex gap-3">
            {currentStep === steps.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                {isEditing ? '保存' : '完成'}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                下一步
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;
