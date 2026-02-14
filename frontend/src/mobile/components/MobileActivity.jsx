import React from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const MobileActivity = ({ onBack }) => {
    // Mock data
    const notifications = [
        {
            id: 1,
            type: 'comment_like',
            user: 'cartoonia_',
            avatar: 'https://i.pravatar.cc/150?u=10',
            text: 'liked your comment: Ufff Tom swag 🔥😂',
            time: '3h',
            targetImage: 'https://picsum.photos/seed/1/50/50'
        },
        {
            id: 2,
            type: 'comment_like',
            users: ['__chaoticccc', 'beingsamikdhar'],
            count: 322,
            avatar: 'https://i.pravatar.cc/150?u=11',
            text: 'liked your comment: Ei maro maro rajur pod maro 😂😂',
            time: '34m',
            targetImage: 'https://picsum.photos/seed/2/50/50'
        },
    ];

    const today = [
        {
            id: 3,
            type: 'follow_accept',
            user: 'itzbano60',
            avatar: 'https://i.pravatar.cc/150?u=12',
            text: 'accepted your follow request.',
            time: '6h',
            action: 'Message'
        },
        {
            id: 4,
            type: 'started_following',
            user: 'itzbano60',
            avatar: 'https://i.pravatar.cc/150?u=12',
            text: 'started following you.',
            time: '6h',
            action: 'Message' // Or Follow Back
        }
    ];

    const yesterday = [
        {
            id: 5,
            type: 'thread',
            user: 'durgapurinfo',
            avatar: 'https://i.pravatar.cc/150?u=13',
            text: 'posted a thread you might like: 🚨 MISSING PERSON ALERT 🚨',
            time: '23h',
            targetImage: 'https://picsum.photos/seed/3/50/50'
        },
        {
            id: 6,
            type: 'suggestion',
            user: 'qwe12351270',
            avatar: 'https://i.pravatar.cc/150?u=14', // Default avatar visual
            text: 'New follow suggestion:',
            time: '1d',
            action: 'Follow'
        }
    ];

    return (
        <div className="bg-black min-h-screen text-white pb-20 scrollbar-hide">
            {/* Header */}
            <div className="sticky top-0 bg-black z-30 px-4 py-3 flex items-center gap-4 border-b border-white/5">
                <button onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Notifications</h1>
            </div>

            <div className="px-4 py-4">
                {/* Follow Requests */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-[#121212]">
                                <UserPlus size={20} />
                            </div>
                            <div className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                                9+
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Follow requests</h3>
                            <p className="text-gray-400 text-xs">Approve or ignore requests</p>
                        </div>
                    </div>
                </div>

                {/* Highlights */}
                <h3 className="font-bold text-base mb-4">Highlights</h3>
                <div className="space-y-4 mb-6">
                    {notifications.map(n => (
                        <div key={n.id} className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                                {isVideo(n.avatar) ? (
                                    <video src={n.avatar} className="w-11 h-11 rounded-full object-cover" autoPlay muted loop playsInline />
                                ) : (
                                    <img src={n.avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
                                )}
                                <div className="text-sm leading-tight">
                                    <span className="font-bold">{n.users ? `${n.users[0]}, ${n.users[1]} and ${n.count} others` : n.user}</span>{' '}
                                    <span className="text-white">{n.text}</span>{' '}
                                    <span className="text-gray-500">{n.time}</span>
                                </div>
                            </div>
                            {n.targetImage && (
                                isVideo(n.targetImage) ? (
                                    <video src={n.targetImage} className="w-11 h-11 rounded-lg object-cover" autoPlay muted loop playsInline />
                                ) : (
                                    <img src={n.targetImage} className="w-11 h-11 rounded-lg object-cover" alt="" />
                                )
                            )}
                        </div>
                    ))}
                </div>

                {/* Today */}
                <h3 className="font-bold text-base mb-4">Today</h3>
                <div className="space-y-4 mb-6">
                    {today.map(n => (
                        <div key={n.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                                {isVideo(n.avatar) ? (
                                    <video src={n.avatar} className="w-11 h-11 rounded-full object-cover" autoPlay muted loop playsInline />
                                ) : (
                                    <img src={n.avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
                                )}
                                <div className="text-sm leading-tight">
                                    <span className="font-bold">{n.user}</span>{' '}
                                    <span className="text-white">{n.text}</span>{' '}
                                    <span className="text-gray-500">{n.time}</span>
                                </div>
                            </div>
                            {n.action && (
                                <button className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${n.action === 'Follow' ? 'bg-blue-500 text-white' : 'bg-[#262626] text-white hover:bg-[#363636]'}`}>
                                    {n.action}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Yesterday */}
                <h3 className="font-bold text-base mb-4">Yesterday</h3>
                <div className="space-y-4 mb-6">
                    {yesterday.map(n => (
                        <div key={n.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                    {isVideo(n.avatar) ? (
                                        <video src={n.avatar} className="w-11 h-11 rounded-full object-cover" autoPlay muted loop playsInline />
                                    ) : (
                                        <img src={n.avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
                                    )}
                                    {/* Icon badge logic if needed */}
                                </div>
                                <div className="text-sm leading-tight">
                                    {n.type === 'suggestion' ? (
                                        <>
                                            <span className="text-white block">{n.text}</span>
                                            <span className="font-bold block">{n.user}</span>
                                            <span className="text-gray-500 block text-xs">{n.time}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-bold">{n.user}</span>{' '}
                                            <span className="text-white">{n.text.replace('MISSING PERSON ALERT', '')}</span>
                                            {' '}
                                            {/* Simulate the bold alert text */}
                                            <span className="font-bold text-red-500">MISSING PERSON ALERT</span>
                                            {' '}
                                            <span className="text-gray-500">{n.time}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {n.action ? (
                                <button className="px-5 py-1.5 bg-blue-600 rounded-lg text-sm font-semibold text-white">
                                    {n.action}
                                </button>
                            ) : n.targetImage ? (
                                isVideo(n.targetImage) ? (
                                    <video src={n.targetImage} className="w-11 h-11 rounded-lg object-cover" autoPlay muted loop playsInline />
                                ) : (
                                    <img src={n.targetImage} className="w-11 h-11 rounded-lg object-cover" alt="" />
                                )
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileActivity;
