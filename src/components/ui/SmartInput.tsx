"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SOURCE_MAPPING } from "@/types/reservation";

interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    transformType?: "source" | "pax" | "option" | "none";
    onValueChange?: (value: string) => void;
}

export function SmartInput({
    className,
    transformType = "none",
    onValueChange,
    ...props
}: SmartInputProps) {
    const [value, setValue] = useState(props.value || "");

    useEffect(() => {
        setValue(props.value || "");
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        if (onValueChange) {
            onValueChange(newValue);
        }
        if (props.onChange) {
            props.onChange(e);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let newValue = value.toString().trim();

        if (transformType === "source") {
            const lower = newValue.toLowerCase();
            // Direct abbreviations
            if (lower === 'm' || newValue === 'ㅡ') newValue = 'M';
            else if (lower === 'z' || newValue === 'ㅋ') newValue = 'Z';
            else if (lower === 't' || newValue === 'ㅅ') newValue = 'T';
            else if (lower === 'w' || newValue === 'ㅈ') newValue = 'W';
            else if (lower === 'k' || newValue === 'ㅏ') newValue = 'KTB';
            else if (lower === 'v' || newValue === 'ㅍ') newValue = 'Viator';
            // Check for exact match in mapping keys and convert to abbreviation
            else if (SOURCE_MAPPING[lower]) {
                const fullName = SOURCE_MAPPING[lower];
                if (fullName === 'MyRealTrip') newValue = 'M';
                else if (fullName === 'ZoomZoom') newValue = 'Z';
                else if (fullName === 'Triple') newValue = 'T';
                else if (fullName === 'Waug') newValue = 'W';
                else if (fullName === 'KTB') newValue = 'KTB';
                else newValue = fullName;
            }
        } else if (transformType === "pax") {
            // If it's just a number, append '명'
            if (/^\d+$/.test(newValue)) {
                newValue = `${newValue}명`;
            }
        } else if (transformType === "option") {
            // If it's just a number, append '부'
            if (/^\d+$/.test(newValue)) {
                newValue = `${newValue}부`;
            }
        }

        if (newValue !== value) {
            setValue(newValue);
            // We need to trigger the parent's change handler if possible, or at least our custom one
            if (onValueChange) {
                onValueChange(newValue);
            }

            // Creating a synthetic event to trigger normal onChange if needed (tricky in detailed implementations)
            // For now, relying on onValueChange is safer for controlled components in this app structure.
        }

        if (props.onBlur) {
            props.onBlur(e);
        }
    };

    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
        />
    );
}
