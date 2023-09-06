import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faBan } from '@fortawesome/free-solid-svg-icons';

import './ServerStatus.scss';

interface ServerStatusProps {
    connected: boolean;
    connecting: boolean;
    responseTime: number;
    serverType: string;
}

const ServerStatus = ({ connecting, connected, responseTime, serverType }: ServerStatusProps) => {
    const { t } = useTranslation();

    const connectionStatus = t(
        (connected && 'Connected') || (connecting && 'Connecting') || 'Disconnected'
    );

    const connectionIcon = (connected && faCheckCircle) || (connecting && faTimesCircle) || faBan;

    const toolTip = `${serverType} is ${connectionStatus}`;

    const pingLevel = `text-${
        connected
            ? responseTime
                ? (responseTime < 150 && 'success') || (responseTime < 300 && 'warning') || 'danger'
                : 'neutral'
            : connecting
            ? 'warning'
            : 'danger'
    }`;

    const pingText2 = `${serverType[0]}: ${
        connected ? (responseTime ? `${responseTime}ms` : 'Waiting') : connectionStatus
    }`;

    return (
        <div className='navbar-item'>
            <span className={pingLevel}>
                {pingText2} <FontAwesomeIcon icon={connectionIcon} title={t(toolTip)} />
            </span>
        </div>
    );
};

ServerStatus.displayName = 'ServerStatus';

export default ServerStatus;
