import LoadingCards from '@/components/card/LoadingCards';
import CategoriesList from '@/components/home/CategoriesList';
import PropertiesContainer from '@/components/home/PropertiesContainer';
import { Suspense } from 'react';

function HomePage({
	searchParams,
}: {
	searchParams: { category?: string; search?: string };
}) {
	// console.log(searchParams);
	// only available in server components
	// searchParams gathers the query params passed via the URL - ?someQuery=value

	return (
		<section>
			<CategoriesList
				category={searchParams.category}
				search={searchParams.search}
			/>
			<Suspense fallback={<LoadingCards />}>
				<PropertiesContainer
					category={searchParams.category}
					search={searchParams.search}
				/>
			</Suspense>
		</section>
	);
}

export default HomePage;
