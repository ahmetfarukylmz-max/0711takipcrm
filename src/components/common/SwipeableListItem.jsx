import React, { useRef, useState } from 'react';
import { EditIcon, TrashIcon } from '../icons';

/**
 * SwipeableListItem - Wrapper component that adds swipe gestures to list items
 * Swipe left to reveal delete, swipe right to reveal edit
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The list item content to render
 * @param {Function} props.onEdit - Callback when edit action is triggered
 * @param {Function} props.onDelete - Callback when delete action is triggered
 * @param {boolean} props.disableEdit - Disable edit action
 * @param {boolean} props.disableDelete - Disable delete action
 */
const SwipeableListItem = ({
    children,
    onEdit,
    onDelete,
    disableEdit = false,
    disableDelete = false
}) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);
    const isDragging = useRef(false);

    const ACTION_THRESHOLD = 80; // Pixels to swipe to trigger action
    const SHOW_THRESHOLD = 40; // Pixels to show the action button

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
        setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;

        currentX.current = e.touches[0].clientX;
        const diff = currentX.current - startX.current;

        // Limit swipe distance
        const maxSwipe = 120;
        const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

        setSwipeOffset(limitedDiff);
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        setIsSwiping(false);

        // Determine action based on swipe distance
        if (swipeOffset < -ACTION_THRESHOLD && !disableDelete) {
            // Swiped left far enough - trigger delete
            onDelete?.();
            setSwipeOffset(0);
        } else if (swipeOffset > ACTION_THRESHOLD && !disableEdit) {
            // Swiped right far enough - trigger edit
            onEdit?.();
            setSwipeOffset(0);
        } else if (Math.abs(swipeOffset) > SHOW_THRESHOLD) {
            // Show the action button
            setSwipeOffset(swipeOffset > 0 ? 80 : -80);
        } else {
            // Reset to center
            setSwipeOffset(0);
        }
    };

    const handleEditClick = () => {
        onEdit?.();
        setSwipeOffset(0);
    };

    const handleDeleteClick = () => {
        onDelete?.();
        setSwipeOffset(0);
    };

    return (
        <div className="relative overflow-hidden">
            {/* Left action (Edit) - visible when swiping right */}
            {!disableEdit && (
                <button
                    onClick={handleEditClick}
                    className="absolute left-0 top-0 bottom-0 w-20 bg-blue-500 flex items-center justify-center text-white transition-transform"
                    style={{
                        transform: `translateX(${swipeOffset > 0 ? '0' : '-100%'})`
                    }}
                >
                    <EditIcon className="w-6 h-6" />
                </button>
            )}

            {/* Right action (Delete) - visible when swiping left */}
            {!disableDelete && (
                <button
                    onClick={handleDeleteClick}
                    className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center text-white transition-transform"
                    style={{
                        transform: `translateX(${swipeOffset < 0 ? '0' : '100%'})`
                    }}
                >
                    <TrashIcon className="w-6 h-6" />
                </button>
            )}

            {/* Swipeable content */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
                }}
                className="relative bg-white dark:bg-gray-800"
            >
                {children}
            </div>
        </div>
    );
};

export default SwipeableListItem;
