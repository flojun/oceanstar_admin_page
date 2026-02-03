"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
    value: string; // YYYY-MM-DD format
    onChange: (date: string) => void;
    label?: string;
    required?: boolean;
}

export function DatePicker({ value, onChange, label, required }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [inputValue, setInputValue] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize current month from value
    useEffect(() => {
        if (value) {
            setCurrentMonth(new Date(value));
            setInputValue(formatDisplayDate(value));
        }
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "";
        // Convert YYYY-MM-DD to MM-DD-YYYY for display
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${month}-${day}-${year}`;
        }
        return dateStr;
    };

    // Smart date parser - handles various formats
    const parseSmartDate = (input: string): string | null => {
        if (!input) return null;

        // Remove extra spaces
        input = input.trim();

        // Try to parse various formats
        // Formats: M/D/YYYY, M.D.YYYY, M-D-YYYY, YYYY-MM-DD, etc.
        const patterns = [
            // M/D/YYYY, MM/DD/YYYY, M-D-YYYY, MM-DD-YYYY
            /^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/,
            // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
            /^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/,
        ];

        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) {
                let year: number, month: number, day: number;

                if (match[1].length === 4) {
                    // YYYY-MM-DD format
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                } else {
                    // M/D/YYYY format
                    month = parseInt(match[1]);
                    day = parseInt(match[2]);
                    year = parseInt(match[3]);
                }

                // Validate
                if (month < 1 || month > 12) return null;
                if (day < 1 || day > 31) return null;
                if (year < 1900 || year > 2100) return null;

                // Check if date is valid (handles Feb 30, etc.)
                const testDate = new Date(year, month - 1, day);
                if (testDate.getFullYear() !== year ||
                    testDate.getMonth() !== month - 1 ||
                    testDate.getDate() !== day) {
                    return null;
                }

                // Return in YYYY-MM-DD format
                return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            }
        }

        return null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const parsed = parseSmartDate(inputValue);
        if (parsed) {
            onChange(parsed);
            setInputValue(formatDisplayDate(parsed));
        } else if (value) {
            // Revert to original value if parsing fails
            setInputValue(formatDisplayDate(value));
        } else {
            setInputValue("");
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const parsed = parseSmartDate(inputValue);
            if (parsed) {
                onChange(parsed);
                setInputValue(formatDisplayDate(parsed));
                setIsOpen(false);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            if (value) {
                setInputValue(formatDisplayDate(value));
            }
        }
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleYearChange = (year: number) => {
        setCurrentMonth(new Date(year, currentMonth.getMonth()));
    };

    const handleMonthChange = (month: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), month));
    };

    const handleDateClick = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        // Use local date formatting to avoid UTC conversion issues
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(formattedDate);
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            // Compare using string format to avoid UTC conversion issues
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = value === dayStr;

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`w-full aspect-square text-sm rounded touch-manipulation ${isSelected ? "bg-blue-600 text-white font-bold hover:bg-blue-700" : "text-gray-700 hover:bg-blue-100"
                        }`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    // Generate year options (current year ± 10 years)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="mb-1 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder="MM-DD-YYYY"
                    className="w-full rounded-md border border-gray-300 p-2 pr-8 text-sm focus:border-blue-500 focus:outline-none bg-white"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 sm:p-4 w-64 sm:w-72">
                    {/* Month Navigation - Horizontal Arrows with Year/Month Selectors */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            onMouseDown={(e) => e.preventDefault()}
                            className="p-0.5 sm:p-1 hover:bg-gray-100 rounded flex-shrink-0"
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </button>

                        <div className="flex items-center gap-2 flex-1 justify-center">
                            {/* Year Selector */}
                            <select
                                value={currentMonth.getFullYear()}
                                onChange={(e) => handleYearChange(Number(e.target.value))}
                                className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}년
                                    </option>
                                ))}
                            </select>

                            {/* Month Selector */}
                            <select
                                value={currentMonth.getMonth()}
                                onChange={(e) => handleMonthChange(Number(e.target.value))}
                                className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {i + 1}월
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextMonth}
                            onMouseDown={(e) => e.preventDefault()}
                            className="p-0.5 sm:p-1 hover:bg-gray-100 rounded flex-shrink-0"
                        >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                </div>
            )}
        </div>
    );
}
