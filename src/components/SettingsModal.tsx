import React, { useRef } from 'react';
import { X, Plus, Trash2, Upload, Disc, Check, Video } from 'lucide-react';
import { CDItem } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cdList: CDItem[];
  activeCdId: string;
  onSelectActiveCd: (id: string) => void;
  onUpdateCdItem: (id: string, updated: Partial<CDItem>) => void;
  onAddCdItem: () => void;
  onDeleteCdItem: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cdList,
  activeCdId,
  onSelectActiveCd,
  onUpdateCdItem,
  onAddCdItem,
  onDeleteCdItem,
}) => {
  const cdCoverInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const mediaInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const liveVideoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  if (!isOpen) return null;

  const handleCdCoverUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    onUpdateCdItem(id, { cdSurfaceImage: url });
  };

  const handleMediaUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    onUpdateCdItem(id, { mediaUrl: url, mediaType });
  };

  const handleLiveVideoUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    onUpdateCdItem(id, { liveVideoUrl: url });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="text-base font-semibold text-neutral-900 tracking-wide">
            设置
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200/80 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CD List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cdList.map((item) => {
            const isActive = item.id === activeCdId;

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                  isActive
                    ? 'border-neutral-900 bg-neutral-900/5'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {/* CD Cover */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => (cdCoverInputRefs.current[item.id] = el)}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCdCoverUpload(item.id, file);
                    e.target.value = '';
                  }}
                />
                <div
                  onClick={() => cdCoverInputRefs.current[item.id]?.click()}
                  className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden border border-neutral-300 bg-neutral-100 flex items-center justify-center cursor-pointer group shadow-inner"
                >
                  {item.cdSurfaceImage ? (
                    <img
                      src={item.cdSurfaceImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Disc className="w-6 h-6 text-neutral-400" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-full">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Media Preview + Name */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    ref={(el) => (mediaInputRefs.current[item.id] = el)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaUpload(item.id, file);
                      e.target.value = '';
                    }}
                  />
                  <div
                    onClick={() => mediaInputRefs.current[item.id]?.click()}
                    className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-neutral-300 bg-neutral-100 flex items-center justify-center cursor-pointer group shadow-sm"
                  >
                    {item.mediaUrl ? (
                      item.mediaType === 'video' ? (
                        <video
                          src={item.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={item.mediaUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <Upload className="w-4 h-4 text-neutral-400" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                      更换
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      ref={(el) => (liveVideoInputRefs.current[item.id] = el)}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLiveVideoUpload(item.id, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => liveVideoInputRefs.current[item.id]?.click()}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                        item.liveVideoUrl
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      <Video className="w-3 h-3" />
                      {item.liveVideoUrl ? 'Live ✓' : 'Live +'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.cdText}
                    onChange={(e) => onUpdateCdItem(item.id, { cdText: e.target.value })}
                    placeholder="CD 名称"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-neutral-800"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectActiveCd(item.id)}
                    title={isActive ? '当前播放中' : '设为当前播放'}
                    className={`p-2 rounded-full transition-colors ${
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  {cdList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCdItem(item.id)}
                      title="删除 CD"
                      className="p-2 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onAddCdItem}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-transform active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>添加 CD</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-neutral-300 hover:bg-neutral-200/60 text-neutral-800 text-xs font-medium transition-colors"
          >
            完成
          </button>
        </div>

      </div>
    </div>
  );
};
