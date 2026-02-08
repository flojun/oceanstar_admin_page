import React from 'react';
import { Vehicle, Driver } from '@/types/vehicle';
import { Reservation } from '@/types/reservation';

interface VehicleManifestTableProps {
    vehicles: Record<string, Vehicle>;
    drivers: Driver[];
    optionName: string;
    date: string;
}

export function VehicleManifestTable({ vehicles, drivers, optionName, date }: VehicleManifestTableProps) {
    const vehicleKeys = ['vehicle-1', 'vehicle-2', 'vehicle-3', 'personal-1'];

    return (
        <div className="bg-black p-4 w-fit min-w-[800px] text-white font-sans inline-block">
            <h2 className="text-2xl font-bold mb-4 text-center">{date} [{optionName}] 배치 명단</h2>

            {/* Flex container to allow natural width for tables but wrap if needed */}
            <div className="flex flex-wrap gap-4 items-start justify-center">
                {vehicleKeys.map(key => {
                    const vehicle = vehicles[key];
                    const driverName = vehicle.driverId ? drivers.find(d => d.id === vehicle.driverId)?.name : '';
                    const totalPax = vehicle.items.reduce((sum, item) => sum + Number(item.pax?.replace(/[^0-9]/g, '') || 0), 0);

                    if (totalPax === 0 && vehicle.items.length === 0) return null;

                    return (
                        <div key={key} className="border border-gray-700 mb-4">
                            {/* Header: Option Name (Red) + Vehicle Name */}
                            <div className="flex text-lg font-bold border-b border-gray-700">
                                <div className={`px-3 py-1 w-20 flex items-center justify-center shrink-0 text-white
                                    ${optionName === '1부' ? 'bg-gray-600' :
                                        optionName === '2부' ? 'bg-[#990000]' :
                                            optionName === '3부' ? 'bg-blue-700' : 'bg-gray-700'}`}>
                                    {optionName}
                                </div>
                                <div className="bg-black text-white px-3 py-1 flex-1 flex items-center justify-between">
                                    <span>{vehicle.name}</span>
                                    <span>{driverName}</span>
                                </div>
                            </div>

                            {/* Table Content */}
                            <table className="w-full text-sm border-collapse bg-black text-white">
                                <thead>
                                    <tr className="border-b border-gray-700 text-gray-400">
                                        <th className="px-2 py-1 border-r border-gray-700 w-24">픽업</th>
                                        <th className="px-2 py-1 border-r border-gray-700 w-20">이름</th>
                                        <th className="px-2 py-1 border-r border-gray-700 w-12">인원</th>
                                        <th className="px-2 py-1">연락처</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicle.items.map((item, idx) => (
                                        <tr key={item.id} className={idx !== vehicle.items.length - 1 ? 'border-b border-gray-800' : ''}>
                                            <td className="px-2 py-1 border-r border-gray-700 font-bold truncate max-w-[120px] text-center">
                                                {item.pickup_location}
                                            </td>
                                            <td className="px-2 py-1 border-r border-gray-700 truncate max-w-[100px] text-center">
                                                {item.name}
                                            </td>
                                            <td className="px-2 py-1 border-r border-gray-700 text-center">
                                                {item.pax?.replace("명", "")}
                                            </td>
                                            <td className="px-2 py-1 text-right text-gray-300 font-mono tracking-wide whitespace-nowrap">
                                                {item.contact}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Footer: Total */}
                            <div className="border-t border-gray-700 p-2 text-right font-bold text-sm text-gray-300">
                                총 {totalPax} 명
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Unassigned Warning if any */}
            {vehicles.unassigned?.items.length > 0 && (
                <div className="mt-4 p-2 border border-red-500 text-red-400 font-bold text-center">
                    ⚠️ 미배정 인원 {vehicles.unassigned.items.length}팀 있습니다.
                </div>
            )}
        </div>
    );
}
