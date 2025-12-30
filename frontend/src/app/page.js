import ImageSlider from "../../components/home/ImageSlider";
import HomeAllProduct from "../../components/home/HomeAllProduct";
import HomeSEO from "../../components/seo/HomeSEO";

/* ✅ Home page specific SEO (optional but recommended) */
export const metadata = {
  title: "OpenUp BD – Best Online Shopping Platform in Bangladesh",
  description:
    "Shop quality products online in Bangladesh from OpenUp BD with fast delivery and trusted service.",
};

export default function HomePage() {
  return (
    <section className="bg-pink-50">
      <HomeSEO />
      <div>
        <ImageSlider />
        <HomeAllProduct />
      </div>
    </section>
  );
}
