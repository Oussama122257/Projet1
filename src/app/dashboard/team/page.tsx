'use client';

import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const members = [
  { id: '1', name: 'Admin', email: 'admin@boutique.dz', role: 'ADMIN', isActive: true, ordersHandled: 456 },
  { id: '2', name: 'Amine Boudjema', email: 'amine@boutique.dz', role: 'AGENT', isActive: true, ordersHandled: 234 },
  { id: '3', name: 'Sara Mansouri', email: 'sara@boutique.dz', role: 'AGENT', isActive: true, ordersHandled: 189 },
  { id: '4', name: 'Karim Zaoui', email: 'karim@boutique.dz', role: 'MANAGER', isActive: false, ordersHandled: 0 },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrateur', color: 'bg-purple-100 text-purple-700' },
  MANAGER: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
  AGENT: { label: 'Agent', color: 'bg-green-100 text-green-700' },
};

export default function TeamPage() {
  const [showAddMember, setShowAddMember] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
          <p className="text-sm text-gray-500">Gérez les membres de votre équipe de confirmation</p>
        </div>
        <button onClick={() => setShowAddMember(true)} className="btn-primary text-sm">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un membre
        </button>
      </div>

      {/* Members list */}
      <div className="card p-0 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Membre</th>
              <th className="table-header">Rôle</th>
              <th className="table-header">Statut</th>
              <th className="table-header">Commandes traitées</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {members.map((member) => {
              const roleInfo = ROLE_LABELS[member.role];
              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                        <span className="text-sm font-semibold text-primary-700">
                          {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', roleInfo.color)}>{roleInfo.label}</span>
                  </td>
                  <td className="table-cell">
                    <span className={cn(
                      'badge',
                      member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {member.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="table-cell font-medium">{member.ordersHandled}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ajouter un membre</h2>
              <button onClick={() => setShowAddMember(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="label">Nom complet *</label>
                <input type="text" className="input mt-1" required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input mt-1" required />
              </div>
              <div>
                <label className="label">Rôle</label>
                <select className="input mt-1">
                  <option value="AGENT">Agent de confirmation</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">
                  <Check className="mr-2 h-4 w-4" /> Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
