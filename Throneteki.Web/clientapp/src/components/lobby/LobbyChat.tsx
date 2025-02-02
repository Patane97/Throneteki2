import { useRef, useEffect, useState } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import { LobbyMessage } from '../../types/lobby';
import { Avatar } from '@nextui-org/react';

interface LobbyChatProps {
    messages: LobbyMessage[];
    isModerator: boolean;
    onRemoveMessageClick: (id: number) => void;
}

const LobbyChat = ({ messages, isModerator, onRemoveMessageClick }: LobbyChatProps) => {
    const messageRef = useRef<HTMLDivElement | null>(null);
    const [canScroll, setCanScroll] = useState(true);

    useEffect(() => {
        // Nudges this to a different timing so that all of the page content is loaded before it tries to scroll
        setTimeout(() => {
            if (canScroll && messageRef.current) {
                messageRef.current.scrollTop = 99999;
            }
        }, 10);
    }, [messageRef, canScroll, messages]);

    const onScroll = () => {
        const messages = messageRef.current;

        if (!messages) {
            return;
        }

        if (messages.scrollTop >= messages.scrollHeight - messages.offsetHeight - 50) {
            setCanScroll(true);
        } else {
            setCanScroll(false);
        }
    };

    const getMessages = () => {
        const groupedMessages: Record<string, LobbyMessage[]> = {};
        const today = moment();
        const yesterday = moment().add(-1, 'days');
        let index = 0;
        let lastUser;
        let currentGroup = 0;

        for (const message of messages) {
            if (!message.user) {
                return undefined;
            }

            const formattedTime = moment(message.time).format('YYYYMMDDHHmm');
            if (lastUser && message.user && lastUser !== message.user.username) {
                currentGroup++;
            }

            const key = message.user.username + formattedTime + currentGroup;

            if (!groupedMessages[key]) {
                groupedMessages[key] = [];
            }

            groupedMessages[key].push(message);

            lastUser = message.user.username;
        }

        return Object.values(groupedMessages).map((messages) => {
            let timestamp;
            const firstMessage = messages[0];

            if (!firstMessage.user) {
                return undefined;
            }

            if (today.isSame(firstMessage.time, 'd')) {
                timestamp = moment(firstMessage.time).format('H:mm');
            } else if (yesterday.isSame(firstMessage.time, 'd')) {
                timestamp = 'yesterday ' + moment(firstMessage.time).format('H:mm');
            } else {
                timestamp = moment(firstMessage.time).format('MMM Do H:mm');
            }

            let i = 0;
            const renderedMessages = messages.map((message) => {
                if (!message.user) {
                    return undefined;
                }

                let messageText;

                if (message.deleted) {
                    if (isModerator) {
                        messageText = (
                            <>
                                <span className='message-deleted message-moderated'>
                                    {message.message}
                                </span>
                                <span className='message-deleted'>
                                    {' '}
                                    - (Message removed by {message.deletedBy})
                                </span>
                            </>
                        );
                    } else {
                        messageText = (
                            <span className='message-deleted'>Message deleted by a moderator</span>
                        );
                    }
                } else {
                    messageText = message.message;
                }

                return (
                    <div key={message.user.username + i++} className='text-white-50 break-words'>
                        {messageText}
                        {isModerator && (
                            <a
                                href='#'
                                className='btn-icon icon-remove'
                                onClick={() => onRemoveMessageClick(message.id)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </a>
                        )}
                    </div>
                );
            });

            const userClass =
                'username' +
                (firstMessage.user.role ? ` ${firstMessage.user.role.toLowerCase()}-role` : '');

            return (
                <div
                    key={timestamp + firstMessage.user.username + (index++).toString()}
                    className='message-container mb-2 flex'
                >
                    <div className='mr-2'>
                        <Avatar src={firstMessage.user.avatar} />
                    </div>
                    <div>
                        <div className='flex'>
                            <span className={userClass}>{firstMessage.user.username}</span>
                            <span className='ml-2 text-white'>{timestamp}</span>
                        </div>
                        <div>{renderedMessages}</div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div
            className='absolute bottom-[50px] left-2 right-0 top-3 overflow-y-auto'
            ref={messageRef}
            onScroll={onScroll}
        >
            {getMessages()}
        </div>
    );
};

LobbyChat.displayName = 'LobbyChat';

export default LobbyChat;
