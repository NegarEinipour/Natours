// Use your Stripe PUBLISHABLE key (pk_test_... or pk_live_...)
const stripe = Stripe(
  "pk_test_51UMTNGLLqbgBehI8D1e8py74cl8Om0M6Rx3odYksGllhamYpTaKFlo5YEeT2wxGLmbPrN385E7iirmpX1amGpOXt00D9S7QaPS",
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get the checkout session from the API endpoint
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.error(err);
    showAlert("error", err.response?.data?.message || "Booking failed");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const bookBtn = document.getElementById("book-tour");
  if (bookBtn) {
    bookBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const { tourId } = e.target.dataset;
      e.target.textContent = "Processing...";
      bookTour(tourId);
    });
  }
});
