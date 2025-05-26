import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { DarkModeContext } from '../../navigation/DarkModeContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const Comments = ({ navigation }) => {
    const { user } = useAuth();
    const comments = user?.user?.comments || [];
    console.log('comments', comments);
    
    const { t } = useTranslation();
    const { darkMode } = useContext(DarkModeContext);

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating - fullStars >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<FontAwesome key={`full-${i}`} name="star" size={16} color="#f1c40f" />);
        }

        if (hasHalfStar) {
            stars.push(<FontAwesome key="half" name="star-half-empty" size={16} color="#f1c40f" />);
        }

        return stars;
    };

    const renderComment = (item, index) => {
        const { text, username, date, rating } = item;

        return (
            <View
                key={index}
                style={[
                    styles.commentCard,
                    { backgroundColor: darkMode ? '#444' : '#fff' },
                ]}
            >
                <View style={styles.commentHeader}>
                    <Text style={[styles.username, { color: darkMode ? '#ffa726' : '#f4511e' }]}>
                        {username || 'Anonymous'}
                    </Text>
                    <Text style={[styles.date, { color: darkMode ? '#ccc' : '#666' }]}>
                        {date || 'Unknown date'}
                    </Text>
                </View>

                <Text style={[styles.commentText, { color: darkMode ? '#fff' : '#000' }]}>
                    {text}
                </Text>

                {rating !== undefined && (
                    <View style={styles.starsContainer}>
                        {renderStars(rating)}
                        <Text style={{ marginLeft: 6, color: darkMode ? '#ccc' : '#333' }}>
                            ({rating})
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <Image
                source={require('../../../images/register-number-background2.jpg')}
                style={styles.backgroundImage}
            />

            {/* Header изцяло извън вътрешния контейнер */}
            <View style={[styles.header, { backgroundColor: darkMode ? '#333232FF' : '#f4511e' }]}>
                <Text style={styles.headerText}>{t('Comments')}</Text>
                <TouchableOpacity onPress={() =>navigation.navigate('AccountManager')}>
                    <Icons name="keyboard-backspace" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.mainContent}>
                <ScrollView contentContainerStyle={styles.commentsContainer}>
                    {comments.length > 0 ? (
                        comments.map(renderComment)
                    ) : (
                        <Text style={[styles.noCommentsText, { color: darkMode ? '#ccc' : '#555' }]}>
                            {t('No comments yet')}
                        </Text>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        width: '100%',
    },
    headerText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    commentsContainer: {
        paddingBottom: 40,
    },
    commentCard: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
    },
    commentText: {
        fontSize: 15,
        marginVertical: 6,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    noCommentsText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 40,
    },
});

export default Comments;
