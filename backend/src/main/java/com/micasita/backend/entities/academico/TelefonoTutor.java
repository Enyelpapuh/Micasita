package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Telefono_tutor")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TelefonoTutor {

    @Id
    @Column(name = "Celular", length = 20)
    private String celular;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_tutor", nullable = false)
    @ToString.Exclude
    private Tutor tutor;
}
