import { useEffect, useState } from 'react';
import { getRecommendationScores } from '@/lib/endpoints';

export const useRecommendations = (menuItemApiIds: string[], isAuthenticated: boolean) => {
    const [scores, setScores] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || menuItemApiIds.length === 0) return;

        let cancelled = false;
        setLoading(true);

        getRecommendationScores({ menu_item_api_ids: menuItemApiIds })
        .then((res) => {
            if (!cancelled && res.data) setScores(res.data);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [menuItemApiIds, isAuthenticated]);

    return { scores, loading };
}