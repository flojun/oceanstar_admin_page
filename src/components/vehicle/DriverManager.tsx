import React, { useState, useEffect } from "react";
import { Plus, Trash2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Driver } from "@/types/vehicle";

interface DriverManagerProps {
    drivers: Driver[];
    onDriversChange: (drivers: Driver[]) => void;
}

export function DriverManager({ drivers, onDriversChange }: DriverManagerProps) {
    const [newDriverName, setNewDriverName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAddDriver = async () => {
        if (!newDriverName.trim()) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from("drivers")
                .insert([{ name: newDriverName.trim() }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                onDriversChange([...drivers, data]);
                setNewDriverName("");
            }
        } catch (error: any) {
            console.error("Error adding driver:", error);
            alert(`기사님 추가 중 오류가 발생했습니다: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDriver = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        try {
            const { error } = await supabase
                .from("drivers")
                .delete()
                .eq("id", id);

            if (error) throw error;
            onDriversChange(drivers.filter(d => d.id !== id));
        } catch (error) {
            console.error("Error deleting driver:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} />
                기사님 관리
            </h3>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder="기사님 성함 입력"
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDriver()}
                />
                <button
                    onClick={handleAddDriver}
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {drivers.map(driver => (
                    <div key={driver.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                        <span>{driver.name}</span>
                        <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="text-gray-400 hover:text-red-600 ml-2 p-1 hover:bg-red-50 rounded"
                            title="삭제"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
