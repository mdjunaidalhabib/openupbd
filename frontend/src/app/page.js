"use client";
import ImageSlider from "../../components/home/ImageSlider";
import HomeAllProduct from "../../components/home/HomeAllProduct";
import FloatingActionButton from "../../components/home/FloatingActionButton";

export default function HomePage() {
  return (
    <section className="bg-pink-50 ">
      <div>
        <ImageSlider />
        <HomeAllProduct />
        <FloatingActionButton />
      </div>
    </section>
  );
}
