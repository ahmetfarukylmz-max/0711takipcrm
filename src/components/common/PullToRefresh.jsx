import React, { useState, useRef, useEffect } from 'react';
import { logger } from '../../utils/logger';

const PullToRefresh = ({ onRefresh, children }) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const startY = useRef(0);
    const containerRef = useRef(null);

    const threshold = 80; // Minimum pull distance to trigger refresh

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e) => {
            // Check both window and container scroll position
            const container = containerRef.current;
            const isAtTop = window.scrollY === 0 && (!container || container.scrollTop === 0);

            if (isAtTop && !isRefreshing) {
                startY.current = e.touches[0].clientY;
                setIsPulling(true);
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling || isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const distance = currentY - startY.current;
            const container = containerRef.current;
            const isAtTop = window.scrollY === 0 && (!container || container.scrollTop === 0);

            // Only allow pulling down when at top
            if (distance > 0 && isAtTop) {
                // Only prevent default if event is cancelable
                if (e.cancelable) {
                    e.preventDefault();
                }

                // Apply resistance to pull (diminishing returns)
                const resistance = Math.min(distance / 2.5, threshold * 1.5);
                setPullDistance(resistance);
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling) return;

            setIsPulling(false);

            if (pullDistance >= threshold && !isRefreshing) {
                setIsRefreshing(true);

                try {
                    await onRefresh();
                } catch (error) {
                    logger.error('Refresh error:', error);
                } finally {
                    // Smooth animation back
                    setTimeout(() => {
                        setIsRefreshing(false);
                        setPullDistance(0);
                    }, 500);
                }
            } else {
                setPullDistance(0);
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, isRefreshing, onRefresh]);

    const getRotation = () => {
        return Math.min((pullDistance / threshold) * 360, 360);
    };

    const getOpacity = () => {
        return Math.min(pullDistance / threshold, 1);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Pull indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-50 transition-transform duration-200"
                style={{
                    transform: `translateY(${Math.min(pullDistance - 40, 40)}px)`,
                    opacity: getOpacity()
                }}
            >
                <div
                    className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
                    style={{
                        transform: `rotate(${getRotation()}deg)`,
                        transition: isRefreshing ? 'transform 0.5s ease' : 'none'
                    }}
                >
                    {isRefreshing ? (
                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.3s ease'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
