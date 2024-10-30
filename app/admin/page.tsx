import ChartsContainter from '@/components/admin/ChartsContainter';
import {
	ChartsLoadingContainer,
	StatsLoadingContainer,
} from '@/components/admin/Loading';
import StatsContainter from '@/components/admin/StatsContainter';
import { Suspense } from 'react';

function AdminPage() {
	return (
		<>
			<Suspense fallback={<StatsLoadingContainer />}>
				<StatsContainter />
			</Suspense>
			<Suspense fallback={<ChartsLoadingContainer />}>
				<ChartsContainter />
			</Suspense>
		</>
	);
}

export default AdminPage;
