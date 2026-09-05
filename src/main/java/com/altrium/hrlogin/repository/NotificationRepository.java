package com.altrium.hrlogin.repository;

import com.altrium.hrlogin.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByRecipientUsernameOrderByCreatedAtDesc(String recipientUsername);
    long countByRecipientUsernameAndIsReadFalse(String recipientUsername);
    List<Notification> findAllByRecipientUsernameAndIsReadFalse(String recipientUsername);
}
