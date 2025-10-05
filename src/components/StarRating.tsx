import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

interface StarRatingProps {
  rating?: number;
  onRatingChange?: (rating: number) => Promise<void>;
  interactive?: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  doctorId?: string;
  userId?: string;
  onRatingSubmit?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  onRatingChange,
  interactive = false,
  size = 'medium',
  showText = true,
  doctorId,
  userId,
  onRatingSubmit
}) => {
  const { t } = useTranslation();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // تحديد أحجام النجوم
  const getStarSize = () => {
    switch (size) {
      case 'small': return { fontSize: 14, gap: 2 };
      case 'large': return { fontSize: 24, gap: 4 };
      default: return { fontSize: 18, gap: 3 };
    }
  };

  const starSize = getStarSize();

  // دالة مساعدة للتصميم المتجاوب
  const isMobile = () => width <= 768;

  const handleStarClick = async (clickedRating: number) => {
    if (!interactive || !onRatingChange) return;
    
    setIsSubmitting(true);
    try {
      await onRatingChange(clickedRating);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      // Rating submission error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarPress = (pressedRating: number) => {
    if (!interactive) return;
    setHoveredRating(pressedRating);
  };

  const handleStarRelease = () => {
    if (!interactive) return;
    setHoveredRating(0);
  };

  const getRatingText = (ratingValue: number) => {
    if (ratingValue === 0) return t('rating.no_rating');
    if (ratingValue <= 1) return t('rating.very_poor');
    if (ratingValue <= 2) return t('rating.poor');
    if (ratingValue <= 3) return t('rating.average');
    if (ratingValue <= 4) return t('rating.good');
    return t('rating.excellent');
  };

  const getRatingColor = (ratingValue: number) => {
    if (ratingValue === 0) return '#ddd';
    if (ratingValue <= 2) return '#ff6b6b';
    if (ratingValue <= 3) return '#ffa726';
    if (ratingValue <= 4) return '#66bb6a';
    return '#4caf50';
  };

  const displayRating = hoveredRating || rating;
  const ratingColor = getRatingColor(displayRating);

  return (
    <View style={styles.container}>
      {/* النجوم */}
      <View style={[styles.starsContainer, { gap: starSize.gap }]}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHovered = interactive && star <= hoveredRating;
          
          return (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarClick(star)}
              onPressIn={() => handleStarPress(star)}
              onPressOut={handleStarRelease}
              style={[
                styles.starButton,
                {
                  transform: [{ scale: isHovered ? 1.1 : 1 }],
                }
              ]}
              disabled={!interactive}
              activeOpacity={interactive ? 0.7 : 1}
            >
              <Ionicons
                name="star"
                size={starSize.fontSize}
                color={isFilled ? ratingColor : '#ddd'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* النص والتفاصيل */}
      {showText && (
        <View style={[styles.textContainer, { gap: isMobile() ? 3 : 5 }]}>
          <Text style={[
            styles.ratingNumber,
            {
              fontSize: isMobile() ? 12 : 14,
              color: ratingColor,
            }
          ]}>
            {displayRating > 0 ? `${displayRating.toFixed(1)}` : '0.0'}
          </Text>
          
          <Text style={[
            styles.ratingText,
            {
              fontSize: isMobile() ? 10 : 12,
            }
          ]}>
            ({getRatingText(displayRating)})
          </Text>
        </View>
      )}

      {/* رسالة النجاح */}
      {showSuccess && (
        <Text style={[
          styles.successMessage,
          {
            fontSize: isMobile() ? 10 : 12,
          }
        ]}>
          ✓ {t('rating.rating_submitted')}
        </Text>
      )}

      {/* مؤشر التحميل */}
      {isSubmitting && (
        <Text style={[
          styles.loadingMessage,
          {
            fontSize: isMobile() ? 10 : 12,
          }
        ]}>
          {t('rating.submitting')}...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
    borderRadius: 4,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingNumber: {
    fontWeight: '600',
    minWidth: 30,
  },
  ratingText: {
    color: '#666',
    fontWeight: '500',
  },
  successMessage: {
    color: '#4caf50',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingMessage: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default StarRating;

