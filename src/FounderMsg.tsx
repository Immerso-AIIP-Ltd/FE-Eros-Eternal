import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FounderMsg = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Back Button */}
      <div className="p-6">
        <button className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-lg">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="d-flex justify-content-center align-items-center flex-grow-1 w-100"
 >
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Founder's Welcome</h1>
            {/* <p className="text-gray-400 text-lg">
              Lorem ipsum dolor sit amet consectetur. Vulputate aenean vulputate pellentesque senectus neque.
            </p> */}
          </div>

          {/* Main Card */}
          <div
            className="border border-purple-500/20 rounded-2xl p-8 mb-8"
            style={{
              background:
                "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
            }}
          >
            {/* Welcome Message */}
            <div className="mb-8">
              <p className="text-lg leading-relaxed mb-6">
                <span className="text-2xl mr-2">👋</span>
                Hey Seeker, I'm Manju, and I believe the future of health is energy, not illness. For too long, healing meant waiting for something to go wrong. Eternal flips that script — it's your digital soul mirror, blending AI + ancient wisdom to help you:
              </p>
            </div>

            {/* Terms and Conditions Lists */}
            <div className="space-y-6">
              {/* First List */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 leading-relaxed">
                    Your subscription will remain active if you paid for ErosNow via Apple In-App Purchase, Google In-App Purchase, or through our local partners. Please ensure you cancel your subscription outside the ErosNow platform before deleting your account.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 leading-relaxed">
                    Deleting your account may not cancel your subscription. Your bank, local partner, Apple In-App Purchase, and Google In-App Purchase might still charge you according to their usual schedule. We recommend cancelling your subscription or any active mandates with these parties before deleting your account.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 leading-relaxed">
                    Deleting your account will result in the permanent loss of all associated data, which cannot be recovered.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 leading-relaxed">
                    Once you submit a request for deletion, you will not be able to cancel it.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 leading-relaxed">
                    After your deletion request is confirmed, you will be logged out of your account and will lose access to any active subscriptions.
                  </p>
                </div>
              </div>

              {/* Spacing between lists */}
              <div className="border-t border-purple-500/10 pt-6"></div>

              {/* Second List (duplicate) */}
              <div className="space-y-4">
                {/* ... (same content as above, you can consider removing the duplicate for clarity) */}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                console.log("check its working");
                navigate("/profile");
              }}
              className="btn btn-info text-white px-4 py-2 fw-medium"
              style={{ fontFamily: "Poppins" }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderMsg;
