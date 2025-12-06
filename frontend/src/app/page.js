import ImageSlider from "../../components/home/ImageSlider";
import HomeAllProduct from "../../components/home/HomeAllProduct";
export default function HomePage() {
  return (
    <section className="bg-pink-50 ">
      <div>
        <ImageSlider />
        <HomeAllProduct />
      </div>
    </section>
  );
}
