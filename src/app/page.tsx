import { getCategories } from '@/lib/java-category';
import InterestSelector from '@/components/Home/InterestSelector';
import NavBar from '@/components/User/NavBar'; // Include NavBar for consistency
import { Localized } from '@/lib/language';

export default async function Home() {
  // Fetch top-level categories (those without parents)
  const categories = (await getCategories()).filter((category) => category.parentId === null);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <NavBar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            <Localized>Discover Your Community</Localized>
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            <Localized>Select an interest to explore posts, chat with others, and find your team.</Localized>
          </p>
        </div>
        <InterestSelector categories={categories} />
      </main>
    </div>
  );
}
