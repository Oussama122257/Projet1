'use client';

import { useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';

export default function InstallPage() {
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let shopDomain = shop.trim();
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    try {
      const res = await fetch(`/api/auth/install?shop=${encodeURIComponent(shopDomain)}`);
      const data = await res.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Erreur lors de l\'installation');
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Package className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Installer ColiShip DZ</h1>
          <p className="mt-2 text-gray-600">Entrez l&apos;URL de votre boutique Shopify</p>
        </div>

        <form onSubmit={handleInstall} className="card">
          <div>
            <label htmlFor="shop" className="label">Boutique Shopify</label>
            <div className="mt-2 flex rounded-lg shadow-sm">
              <input
                type="text"
                id="shop"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="ma-boutique"
                className="input rounded-r-none"
                required
              />
              <span className="inline-flex items-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                .myshopify.com
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? 'Installation...' : 'Installer l\'application'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
