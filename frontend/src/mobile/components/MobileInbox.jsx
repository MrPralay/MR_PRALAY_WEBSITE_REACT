import React from 'react';
import { Search, Edit, Camera, ChevronLeft } from 'lucide-react';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const MobileInbox = ({ onBack, currentUser }) => {
    const [selectedChat, setSelectedChat] = React.useState(null);

    // Mock data
    const notes = [
        { id: 1, user: 'Abinash', note: 'Until I Found You...', song: true, image: 'https://i.pravatar.cc/150?u=1' },
        { id: 2, user: 'Map', note: 'New', song: false, image: null, isAdd: true }, // Placeholder for 'Map' feature or Add Note
        { id: 3, user: 'Sarah', note: 'Bored 😴', song: false, image: 'https://i.pravatar.cc/150?u=3' },
    ];

    const messages = [
        { id: 1, user: '☆_♡ ⓟ𝐫 αℓαγ ʕ•́؈•̀₎_☆', message: 'Sent 39m ago', image: 'https://i.pravatar.cc/150?u=4', unread: true },
        { id: 2, user: 'stranger things', message: 'strangerthingstv sent a photo · 4d', image: 'https://i.pravatar.cc/150?u=5', unread: true, count: 5 },
        { id: 3, user: 'Souradeep Das', message: 'Sent Sunday', image: 'https://i.pravatar.cc/150?u=6', unread: false },
        { id: 4, user: '★☆★', message: 'Sent a reel by _rupam_2.7 · 4d', image: 'https://i.pravatar.cc/150?u=7', unread: false },
        { id: 5, user: 'Shreya♡', message: 'Sent a reel by nushslayss · 5d', image: 'https://i.pravatar.cc/150?u=8', unread: false },
    ];

    if (selectedChat) {
        return <ChatThread chat={selectedChat} onBack={() => setSelectedChat(null)} />;
    }

    return (
        <div className="bg-black min-h-screen text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-black z-30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2" onClick={onBack}>
                    <ChevronLeft size={28} />
                    <h1 className="text-xl font-bold flex items-center gap-1">
                        {currentUser?.username || "Neural Hive"} <ChevronDown size={14} />
                    </h1>
                </div>
                <div className="flex items-center gap-5">
                    {/* Video Call Icon */}
                    {/* Write Message Icon */}
                    <Edit size={24} />
                </div>
            </div>

            <div className="px-4 pb-4">
                {/* Search */}
                <div className="bg-[#262626] rounded-xl flex items-center px-4 py-2 gap-3 mb-6">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search or ask Meta AI"
                        className="bg-transparent text-white placeholder-gray-400 text-sm w-full focus:outline-none"
                    />
                </div>

                {/* Notes Rail */}
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide mb-2">
                    {/* Your Note */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 relative">
                        <div className="absolute -top-8 bg-[#262626] px-3 py-1 rounded-xl rounded-bl-sm text-[10px] text-gray-300 whitespace-nowrap">
                            Note...
                        </div>
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                            {isVideo(currentUser?.profileImage || currentUser?.image) ? (
                                <video
                                    src={currentUser?.profileImage || currentUser?.image}
                                    className="w-full h-full object-cover opacity-60"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <img src={currentUser?.profileImage || currentUser?.image || "https://i.pravatar.cc/150?u=0"} alt="Me" className="w-full h-full object-cover opacity-60" />
                            )}
                        </div>
                        <span className="text-xs text-center text-gray-400 truncate w-16">Your note</span>
                        <div className="absolute top-0 right-0 bg-gray-800 rounded-full p-1 border border-black text-[10px] text-white">
                            +
                        </div>
                    </div>

                    {notes.map((note) => (
                        <div key={note.id} className="flex flex-col items-center gap-1 flex-shrink-0 relative cursor-pointer">
                            {note.isAdd ? (
                                <>
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[#262626] flex items-center justify-center border border-white/10">
                                        {/* Map Icon placeholder */}
                                        <span className="text-xs">Map</span>
                                    </div>
                                    <div className="absolute -top-8 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-xl text-[10px] whitespace-nowrap font-bold">
                                        New
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute -top-10 bg-[#262626] px-3 py-2 rounded-2xl rounded-bl-sm text-[10px] max-w-[80px] text-center text-gray-200 line-clamp-2 leading-tight">
                                        {note.note}
                                        {note.song && <div className="text-[8px] text-gray-500 mt-1 truncate">Francis Greg</div>}
                                    </div>
                                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 mt-2">
                                        {isVideo(note.image) ? (
                                            <video
                                                src={note.image}
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            <img src={note.image} alt={note.user} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </>
                            )}
                            <span className="text-xs text-center text-white truncate w-16 mt-1">{note.user}</span>
                        </div>
                    ))}
                </div>

                {/* Messages List */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-base">Messages</h3>
                    <span className="text-blue-500 text-sm font-semibold">Requests</span>
                </div>

                <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            onClick={() => setSelectedChat(msg)}
                            className="flex items-center justify-between active:bg-white/5 p-2 rounded-lg -mx-2 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-white/5">
                                    {isVideo(msg.image) ? (
                                        <video
                                            src={msg.image}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <img src={msg.image} alt={msg.user} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`text-sm truncate ${msg.unread ? 'font-bold text-white' : 'font-normal text-white'}`}>
                                        {msg.user}
                                    </span>
                                    <span className={`text-sm truncate ${msg.unread ? 'font-bold text-white' : 'text-gray-400'}`}>
                                        {msg.message}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {msg.unread && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                )}
                                <Camera size={24} className="text-gray-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper for icon
const ChevronDown = ({ size }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const ChatThread = ({ chat, onBack }) => {
    return (
        <div className="bg-black fixed inset-0 z-[70] flex flex-col text-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-black z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack}><ChevronLeft size={28} /></button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                            {isVideo(chat.image) ? (
                                <video
                                    src={chat.image}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <img src={chat.image} alt={chat.user} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold truncate leading-none">{chat.user}</span>
                            <span className="text-[10px] text-gray-500">Active now</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <button className="text-white"><div className="w-6 h-6 border-2 border-white rounded-md flex items-center justify-center text-[10px]">📞</div></button>
                    <button className="text-white"><div className="w-6 h-6 border-2 border-white rounded-md flex items-center justify-center text-[10px]">📹</div></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div className="flex flex-col items-center py-10 opacity-40">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                        {isVideo(chat.image) ? (
                            <video
                                src={chat.image}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img src={chat.image} alt={chat.user} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <h2 className="font-bold text-lg">{chat.user}</h2>
                    <p className="text-xs">Instagram · synapse_user</p>
                    <button className="mt-4 bg-white/10 px-4 py-2 rounded-lg text-xs font-bold">View Profile</button>
                </div>

                <div className="self-start bg-[#262626] px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%] text-sm">
                    {chat.message}
                </div>

                <div className="self-end bg-blue-500 px-4 py-2 rounded-2xl rounded-br-sm max-w-[80%] text-sm">
                    Hey! I received your message. Establishing neural link...
                </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black">
                <div className="bg-[#262626] rounded-full flex items-center px-4 py-2 gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">📷</div>
                    <input type="text" placeholder="Message..." className="bg-transparent text-white placeholder-gray-500 text-sm w-full focus:outline-none" />
                    <button className="text-blue-500 font-bold text-sm">Send</button>
                </div>
            </div>
        </div>
    );
};

export default MobileInbox;
